import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { Workflow } from './entities/workflow.entity'
import { WorkflowVersion } from './entities/workflow-version.entity'
import {
  CreateWorkflowDto, UpdateWorkflowDto, SaveVersionDto, WorkflowQueryDto,
} from './dto/workflow.dto'

const MAX_VERSIONS = 50

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly repo: Repository<Workflow>,
    @InjectRepository(WorkflowVersion)
    private readonly versionRepo: Repository<WorkflowVersion>,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateWorkflowDto): Promise<Workflow> {
    const wf = this.repo.create({
      userId,
      name:        dto.name,
      description: dto.description ?? null,
      tags:        dto.tags ?? [],
      nodes:       (dto.nodes as Workflow['nodes']) ?? [],
      edges:       (dto.edges as Workflow['edges']) ?? [],
      settings:    dto.settings ?? {},
    })
    return this.repo.save(wf)
  }

  async findAll(userId: string, query: WorkflowQueryDto): Promise<{ data: Workflow[]; total: number }> {
    const { search, tag, page = 1, limit = 20 } = query
    const qb = this.repo.createQueryBuilder('wf')
      .where('wf.userId = :userId', { userId })
      .orderBy('wf.updatedAt', 'DESC')

    if (search) {
      qb.andWhere('(wf.name ILIKE :search OR wf.description ILIKE :search)', {
        search: `%${search}%`,
      })
    }
    if (tag) {
      qb.andWhere(':tag = ANY(wf.tags)', { tag })
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return { data, total }
  }

  async findOne(id: string, userId: string): Promise<Workflow> {
    const wf = await this.repo.findOne({ where: { id } })
    if (!wf) throw new NotFoundException('Workflow not found')
    if (wf.userId !== userId) throw new ForbiddenException()
    return wf
  }

  /** Internal lookup — skips ownership check. Use only from trusted services (scheduler, queue). */
  async findOneInternal(id: string): Promise<Workflow> {
    const wf = await this.repo.findOne({ where: { id } })
    if (!wf) throw new NotFoundException('Workflow not found')
    return wf
  }

  async update(id: string, userId: string, dto: UpdateWorkflowDto): Promise<Workflow> {
    const wf = await this.findOne(id, userId)
    Object.assign(wf, {
      ...(dto.name        !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive    !== undefined && { isActive: dto.isActive }),
      ...(dto.tags        !== undefined && { tags: dto.tags }),
      ...(dto.nodes       !== undefined && { nodes: dto.nodes }),
      ...(dto.edges       !== undefined && { edges: dto.edges }),
      ...(dto.settings    !== undefined && { settings: dto.settings }),
    })
    return this.repo.save(wf)
  }

  async remove(id: string, userId: string): Promise<void> {
    const wf = await this.findOne(id, userId)
    await this.repo.remove(wf)
  }

  // ── Versions ────────────────────────────────────────────────────

  async saveVersion(id: string, userId: string, dto: SaveVersionDto): Promise<WorkflowVersion> {
    const wf = await this.findOne(id, userId)

    // Prune oldest beyond cap
    const count = await this.versionRepo.count({ where: { workflowId: id } })
    if (count >= MAX_VERSIONS) {
      const oldest = await this.versionRepo.findOne({
        where: { workflowId: id },
        order: { createdAt: 'ASC' },
      })
      if (oldest) await this.versionRepo.remove(oldest)
    }

    const version = this.versionRepo.create({
      workflowId:  id,
      name:        dto.name ?? `Version ${new Date().toLocaleString()}`,
      description: dto.description ?? null,
      snapshot: {
        nodes:    wf.nodes,
        edges:    wf.edges,
        settings: wf.settings,
        name:     wf.name,
      },
      nodeCount: wf.nodes.length,
      edgeCount: wf.edges.length,
      createdBy: userId,
    })

    return this.versionRepo.save(version)
  }

  async listVersions(id: string, userId: string): Promise<WorkflowVersion[]> {
    await this.findOne(id, userId)
    return this.versionRepo.find({
      where: { workflowId: id },
      order: { createdAt: 'DESC' },
      take:  MAX_VERSIONS,
    })
  }

  async restoreVersion(workflowId: string, versionId: string, userId: string): Promise<Workflow> {
    const wf      = await this.findOne(workflowId, userId)
    const version = await this.versionRepo.findOne({ where: { id: versionId, workflowId } })
    if (!version) throw new NotFoundException('Version not found')

    const snap = version.snapshot as { nodes: Workflow['nodes']; edges: Workflow['edges']; settings: Workflow['settings'] }
    wf.nodes    = snap.nodes    ?? []
    wf.edges    = snap.edges    ?? []
    wf.settings = snap.settings ?? {}

    return this.repo.save(wf)
  }

  async deleteVersion(workflowId: string, versionId: string, userId: string): Promise<void> {
    await this.findOne(workflowId, userId)
    const version = await this.versionRepo.findOne({ where: { id: versionId, workflowId } })
    if (!version) throw new NotFoundException('Version not found')
    await this.versionRepo.remove(version)
  }

  // ── Stats update (called by execution engine) ──────────────────

  async recordRunComplete(id: string, status: string): Promise<void> {
    await this.repo.update(id, {
      lastRunAt:     new Date(),
      lastRunStatus: status,
      totalRuns:     () => 'total_runs + 1',
    })
  }
}
