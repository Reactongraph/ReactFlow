import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { WorkflowRun, TriggerType } from './entities/workflow-run.entity'
import { ExecutionLog } from './entities/execution-log.entity'
import { WorkflowsService } from '../workflows/workflows.service'

export const EXECUTION_QUEUE = 'workflow-execution'

export interface TriggerRunOptions {
  workflowId:       string
  userId:           string
  triggerType:      TriggerType
  triggerData?:     Record<string, unknown>
  /** Skip ownership check — only set from trusted internal callers (scheduler, webhook trigger) */
  bypassOwnership?: boolean
}

@Injectable()
export class ExecutionService {
  constructor(
    @InjectRepository(WorkflowRun)
    private readonly runRepo: Repository<WorkflowRun>,
    @InjectRepository(ExecutionLog)
    private readonly logRepo: Repository<ExecutionLog>,
    @InjectQueue(EXECUTION_QUEUE)
    private readonly queue: Queue,
    private readonly workflowsService: WorkflowsService,
  ) {}

  // ── Trigger ───────────────────────────────────────────────────

  async triggerRun(opts: TriggerRunOptions): Promise<WorkflowRun> {
    // Verify workflow exists — bypass ownership check for internal callers
    const wf = opts.bypassOwnership
      ? await this.workflowsService.findOneInternal(opts.workflowId)
      : await this.workflowsService.findOne(opts.workflowId, opts.userId)

    // Create a pending run record
    const run = await this.runRepo.save(this.runRepo.create({
      workflowId:  wf.id,
      userId:      opts.userId,
      status:      'pending',
      triggerType: opts.triggerType,
      triggerData: opts.triggerData ?? null,
      nodeCount:   wf.nodes.length,
    }))

    // Enqueue the job — workers pick it up asynchronously
    await this.queue.add('execute', {
      runId:      run.id,
      workflowId: wf.id,
      userId:     opts.userId,
      nodes:      wf.nodes,
      edges:      wf.edges,
      settings:   wf.settings,
      triggerData: opts.triggerData,
    }, {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail:     false,
    })

    return run
  }

  // ── Queries ───────────────────────────────────────────────────

  async listRuns(
    workflowId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: WorkflowRun[]; total: number }> {
    // Ownership check
    await this.workflowsService.findOne(workflowId, userId)

    const [data, total] = await this.runRepo.findAndCount({
      where:  { workflowId },
      order:  { createdAt: 'DESC' },
      skip:   (page - 1) * limit,
      take:   limit,
    })
    return { data, total }
  }

  async getRun(runId: string, userId: string): Promise<WorkflowRun> {
    const run = await this.runRepo.findOne({
      where: { id: runId },
      relations: ['workflow'],
    })
    if (!run) throw new NotFoundException('Run not found')
    if (run.userId !== userId) throw new ForbiddenException()
    return run
  }

  async getLogs(runId: string, userId: string): Promise<ExecutionLog[]> {
    await this.getRun(runId, userId)
    return this.logRepo.find({
      where: { runId },
      order: { createdAt: 'ASC' },
    })
  }

  async cancelRun(runId: string, userId: string): Promise<void> {
    const run = await this.getRun(runId, userId)
    if (run.status !== 'running' && run.status !== 'pending') {
      throw new Error('Run is not in a cancellable state')
    }

    // Remove from queue if still pending
    const jobs = await this.queue.getJobs(['waiting', 'delayed', 'active'])
    for (const job of jobs) {
      if ((job.data as { runId: string }).runId === runId) {
        await job.discard()
      }
    }

    await this.runRepo.update(runId, {
      status:      'cancelled',
      completedAt: new Date(),
    })
  }

  async getStats(userId: string): Promise<{
    total: number
    completed: number
    failed: number
    avgDurationMs: number
  }> {
    const result = await this.runRepo
      .createQueryBuilder('r')
      .innerJoin('r.workflow', 'w')
      .where('w.userId = :userId', { userId })
      .select([
        'COUNT(*) AS total',
        "COUNT(*) FILTER (WHERE r.status = 'completed') AS completed",
        "COUNT(*) FILTER (WHERE r.status = 'failed') AS failed",
        'AVG(r.duration_ms) FILTER (WHERE r.duration_ms IS NOT NULL) AS avg_duration',
      ])
      .getRawOne()

    return {
      total:         parseInt(result.total ?? '0'),
      completed:     parseInt(result.completed ?? '0'),
      failed:        parseInt(result.failed ?? '0'),
      avgDurationMs: Math.round(parseFloat(result.avg_duration ?? '0')),
    }
  }
}
