import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomBytes } from 'crypto'
import { Webhook } from './entities/webhook.entity'
import { ExecutionService } from '../execution/execution.service'

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private readonly repo: Repository<Webhook>,
    private readonly executionService: ExecutionService,
  ) {}

  async create(workflowId: string, userId: string, description?: string): Promise<Webhook> {
    const token = randomBytes(32).toString('hex')
    return this.repo.save(this.repo.create({ workflowId, userId, token, description: description ?? null }))
  }

  async listForWorkflow(workflowId: string, userId: string): Promise<Webhook[]> {
    return this.repo.find({ where: { workflowId, userId }, order: { createdAt: 'DESC' } })
  }

  async delete(id: string, userId: string): Promise<void> {
    const wh = await this.repo.findOne({ where: { id } })
    if (!wh) throw new NotFoundException('Webhook not found')
    if (wh.userId !== userId) throw new ForbiddenException()
    await this.repo.delete(id)
  }

  async trigger(token: string, payload: Record<string, unknown>): Promise<{ runId: string }> {
    const wh = await this.repo.findOne({ where: { token, isActive: true } })
    if (!wh) throw new NotFoundException('Invalid or inactive webhook token')

    // Update hit stats
    await this.repo.update(wh.id, {
      hitCount: wh.hitCount + 1,
      lastTriggeredAt: new Date(),
    })

    const run = await this.executionService.triggerRun({
      workflowId:      wh.workflowId,
      userId:          wh.userId,
      triggerType:     'webhook',
      triggerData:     payload,
      bypassOwnership: true,
    })

    return { runId: run.id }
  }
}
