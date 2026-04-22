import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WorkflowRun } from '../execution/entities/workflow-run.entity'
import { ExecutionLog } from '../execution/entities/execution-log.entity'

export interface PlatformMetrics {
  totalRuns:     number
  runningNow:    number
  completedToday: number
  failedToday:   number
  avgDurationMs: number
  topFailingNodes: Array<{ nodeLabel: string; failCount: number }>
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name)

  constructor(
    @InjectRepository(WorkflowRun)
    private readonly runRepo: Repository<WorkflowRun>,
    @InjectRepository(ExecutionLog)
    private readonly logRepo: Repository<ExecutionLog>,
  ) {}

  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalRuns, runningNow, completedToday, failedToday, avgResult] = await Promise.all([
      this.runRepo.count(),
      this.runRepo.count({ where: { status: 'running' } }),
      this.runRepo.createQueryBuilder('r')
        .where("r.status = 'completed' AND r.created_at >= :today", { today })
        .getCount(),
      this.runRepo.createQueryBuilder('r')
        .where("r.status = 'failed' AND r.created_at >= :today", { today })
        .getCount(),
      this.runRepo.createQueryBuilder('r')
        .select('AVG(r.duration_ms)', 'avg')
        .where('r.duration_ms IS NOT NULL')
        .getRawOne(),
    ])

    // Top failing nodes
    const topFailing = await this.logRepo
      .createQueryBuilder('l')
      .select('l.node_label', 'nodeLabel')
      .addSelect('COUNT(*)', 'failCount')
      .where("l.level = 'error' AND l.node_id IS NOT NULL")
      .groupBy('l.node_label')
      .orderBy('failCount', 'DESC')
      .limit(5)
      .getRawMany<{ nodeLabel: string; failCount: string }>()

    return {
      totalRuns,
      runningNow,
      completedToday,
      failedToday,
      avgDurationMs: Math.round(parseFloat(avgResult?.avg ?? '0')),
      topFailingNodes: topFailing.map(r => ({
        nodeLabel: r.nodeLabel,
        failCount: parseInt(r.failCount),
      })),
    }
  }

  logInfo(context: string, message: string, data?: unknown): void {
    this.logger.log(`[${context}] ${message}${data ? ` — ${JSON.stringify(data)}` : ''}`)
  }

  logError(context: string, message: string, err?: unknown): void {
    this.logger.error(`[${context}] ${message}`, err instanceof Error ? err.stack : String(err))
  }
}
