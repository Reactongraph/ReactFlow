import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Job } from 'bull'
import { WorkflowEngine } from '../execution/engine/workflow-engine'
import { WorkflowRun } from '../execution/entities/workflow-run.entity'
import { ExecutionLog } from '../execution/entities/execution-log.entity'
import { NodeRegistryService } from '../nodes/node-registry.service'
import { WorkflowsService } from '../workflows/workflows.service'
import { WorkflowGateway } from '../websocket/workflow.gateway'
import { WorkflowNodeData, WorkflowEdgeData, WorkflowSettings } from '../workflows/entities/workflow.entity'
import { EXECUTION_QUEUE } from '../execution/execution.service'

interface ExecutionJobData {
  runId:       string
  workflowId:  string
  userId:      string
  nodes:       WorkflowNodeData[]
  edges:       WorkflowEdgeData[]
  settings:    WorkflowSettings
  triggerData?: Record<string, unknown>
}

@Processor(EXECUTION_QUEUE)
export class ExecutionProcessor {
  private readonly logger = new Logger(ExecutionProcessor.name)

  constructor(
    @InjectRepository(WorkflowRun)
    private readonly runRepo: Repository<WorkflowRun>,
    @InjectRepository(ExecutionLog)
    private readonly logRepo: Repository<ExecutionLog>,
    private readonly registry: NodeRegistryService,
    private readonly workflowsService: WorkflowsService,
    private readonly gateway: WorkflowGateway,
  ) {}

  @Process('execute')
  async handleExecution(job: Job<ExecutionJobData>): Promise<void> {
    const { runId, workflowId, userId, nodes, edges, settings, triggerData } = job.data
    this.logger.log(`Processing run ${runId} for workflow ${workflowId}`)

    const engine = new WorkflowEngine(
      this.runRepo,
      this.logRepo,
      this.registry,
      this.gateway,
    )

    try {
      const run = await engine.execute(
        {
          runId,
          workflowId,
          userId,
          options: {
            maxRetries: settings.maxRetries ?? 3,
            retryDelay: settings.retryDelay ?? 1000,
            timeout:    settings.timeout    ?? 30_000,
          },
        },
        nodes,
        edges,
        triggerData,
      )

      // Update workflow stats
      await this.workflowsService.recordRunComplete(workflowId, run.status)
      this.logger.log(`Run ${runId} completed with status: ${run.status}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`Run ${runId} encountered a fatal error: ${msg}`)

      await this.runRepo.update(runId, {
        status:       'failed',
        completedAt:  new Date(),
        errorMessage: msg,
      })
      this.gateway.emitExecutionEvent(workflowId, 'run:failed', { runId, error: msg })
    }
  }

  @OnQueueFailed()
  onFailed(job: Job<ExecutionJobData>, err: Error) {
    this.logger.error(`Job ${job.id} (run: ${job.data.runId}) failed: ${err.message}`)
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ExecutionJobData>) {
    this.logger.log(`Job ${job.id} (run: ${job.data.runId}) done`)
  }
}
