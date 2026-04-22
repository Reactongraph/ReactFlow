import { Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WorkflowRun, NodeRunResult } from '../entities/workflow-run.entity'
import { ExecutionLog } from '../entities/execution-log.entity'
import { WorkflowNodeData, WorkflowEdgeData } from '../../workflows/entities/workflow.entity'
import { NodeRegistryService } from '../../nodes/node-registry.service'
import {
  buildGraph, resolveNextNodes, ExecutionGraph,
} from './graph-traversal'
import { WorkflowGateway } from '../../websocket/workflow.gateway'

export interface EngineOptions {
  maxRetries?:  number
  retryDelay?:  number
  timeout?:     number
}

export interface EngineContext {
  runId:      string
  workflowId: string
  userId:     string
  options:    EngineOptions
}

interface NodeOutput {
  success: boolean
  data?: unknown
  error?: string
  branchId?: string
}

const DEFAULT_OPTIONS: Required<EngineOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout:    30_000,
}

export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name)

  constructor(
    private readonly runRepo: Repository<WorkflowRun>,
    private readonly logRepo: Repository<ExecutionLog>,
    private readonly registry: NodeRegistryService,
    private readonly gateway?: WorkflowGateway,
  ) {}

  async execute(
    ctx: EngineContext,
    nodes: WorkflowNodeData[],
    edges: WorkflowEdgeData[],
    triggerData?: unknown,
  ): Promise<WorkflowRun> {
    const opts = { ...DEFAULT_OPTIONS, ...ctx.options }

    // Update run to running
    await this.runRepo.update(ctx.runId, { status: 'running', startedAt: new Date() })
    this.gateway?.emitExecutionEvent(ctx.workflowId, 'run:started', { runId: ctx.runId })

    const graph = buildGraph(nodes, edges)
    const dataStore = new Map<string, unknown>([['__trigger__', triggerData]])

    // Track which nodes to skip (skipped branches in decision nodes)
    const skipSet   = new Set<string>()
    const nodeResults: Record<string, NodeRunResult> = {}

    await this.log(ctx.runId, null, null, 'info',
      `Starting execution — ${nodes.length} nodes, ${edges.length} edges`)

    for (const nodeId of graph.order) {
      if (skipSet.has(nodeId)) {
        await this.log(ctx.runId, nodeId, graph.nodeMap.get(nodeId)?.label ?? nodeId,
          'info', 'Node skipped (inactive branch)')
        continue
      }

      const node = graph.nodeMap.get(nodeId)
      if (!node) continue

      const inputData = this.collectInputData(nodeId, graph, dataStore)
      const result    = await this.executeNode(ctx, node, inputData, opts)

      nodeResults[nodeId] = {
        nodeId,
        nodeLabel:  node.label,
        status:     result.success ? 'success' : 'error',
        input:      inputData,
        output:     result.data,
        error:      result.error,
        durationMs: result.durationMs,
        startedAt:  result.startedAt,
      }

      if (result.success) {
        dataStore.set(nodeId, result.data)
        this.gateway?.emitExecutionEvent(ctx.workflowId, 'node:completed', {
          runId: ctx.runId, nodeId, status: 'success', output: result.data,
        })

        // For decision nodes — skip the losing branch
        if (result.branchId) {
          const chosen  = resolveNextNodes(graph, nodeId, result.branchId)
          const allNext = graph.adjacency.get(nodeId) ?? []
          for (const next of allNext) {
            if (!chosen.includes(next)) this.addSubtreeToSkip(next, graph, skipSet)
          }
        }
      } else {
        // Failed node — skip all downstream
        this.addSubtreeToSkip(nodeId, graph, skipSet)
        skipSet.delete(nodeId) // the node itself was already executed

        this.gateway?.emitExecutionEvent(ctx.workflowId, 'node:failed', {
          runId: ctx.runId, nodeId, error: result.error,
        })

        // Mark run as failed — use query builder to avoid JSONB type constraints
        await this.runRepo.createQueryBuilder()
          .update()
          .set({
            status:       'failed',
            completedAt:  new Date(),
            durationMs:   Date.now() - (Date.parse(result.startedAt)),
            errorMessage: result.error ?? 'Unknown error',
            nodeResults:  () => `'${JSON.stringify(nodeResults)}'::jsonb`,
          })
          .where('id = :id', { id: ctx.runId })
          .execute()
        this.gateway?.emitExecutionEvent(ctx.workflowId, 'run:failed', {
          runId: ctx.runId, error: result.error,
        })
        return this.runRepo.findOne({ where: { id: ctx.runId } }) as Promise<WorkflowRun>
      }
    }

    const run = await this.runRepo.findOne({ where: { id: ctx.runId } })
    const startedAt = run?.startedAt?.getTime() ?? Date.now()

    await this.runRepo.createQueryBuilder()
      .update()
      .set({
        status:      'completed',
        completedAt: new Date(),
        durationMs:  Date.now() - startedAt,
        nodeResults: () => `'${JSON.stringify(nodeResults)}'::jsonb`,
      })
      .where('id = :id', { id: ctx.runId })
      .execute()
    await this.log(ctx.runId, null, null, 'success', 'Workflow completed successfully')
    this.gateway?.emitExecutionEvent(ctx.workflowId, 'run:completed', { runId: ctx.runId })

    return this.runRepo.findOne({ where: { id: ctx.runId } }) as Promise<WorkflowRun>
  }

  // ── Node execution with retry ────────────────────────────────

  private async executeNode(
    ctx: EngineContext,
    node: WorkflowNodeData,
    inputData: Record<string, unknown>,
    opts: Required<EngineOptions>,
  ): Promise<NodeOutput & { durationMs: number; startedAt: string }> {
    const handler = this.registry.getHandler(node.type)
    const startedAt = new Date().toISOString()
    const t0 = Date.now()

    await this.log(ctx.runId, node.id, node.label, 'info', `Executing node "${node.label}"`)
    this.gateway?.emitExecutionEvent(ctx.workflowId, 'node:started', {
      runId: ctx.runId, nodeId: node.id,
    })

    if (!handler) {
      const err = `No handler registered for node type "${node.type}"`
      await this.log(ctx.runId, node.id, node.label, 'error', err)
      return { success: false, error: err, durationMs: Date.now() - t0, startedAt }
    }

    let lastError = ''
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const output = await Promise.race([
          handler.execute({
            nodeId:    node.id,
            nodeType:  node.type,
            config:    (node.config ?? {}) as Record<string, unknown>,
            data:      (node.data   ?? {}) as Record<string, unknown>,
            inputData,
            runId:     ctx.runId,
            userId:    ctx.userId,
            logger: {
              info:    (msg, data?) => this.log(ctx.runId, node.id, node.label, 'info', msg, data),
              success: (msg, data?) => this.log(ctx.runId, node.id, node.label, 'success', msg, data),
              warn:    (msg, data?) => this.log(ctx.runId, node.id, node.label, 'warning', msg, data),
              error:   (msg, data?) => this.log(ctx.runId, node.id, node.label, 'error', msg, data),
            },
          }),
          this.timeout(opts.timeout),
        ])

        const durationMs = Date.now() - t0
        await this.log(ctx.runId, node.id, node.label, 'success',
          `Completed in ${durationMs}ms`, { output: output.data }, durationMs)

        return { ...output, success: true, durationMs, startedAt }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err)
        if (attempt < opts.maxRetries) {
          await this.log(ctx.runId, node.id, node.label, 'warning',
            `Attempt ${attempt + 1} failed — retrying in ${opts.retryDelay}ms: ${lastError}`)
          await this.sleep(opts.retryDelay)
        }
      }
    }

    const durationMs = Date.now() - t0
    await this.log(ctx.runId, node.id, node.label, 'error',
      `Failed after ${opts.maxRetries + 1} attempts: ${lastError}`, undefined, durationMs)

    return { success: false, error: lastError, durationMs, startedAt }
  }

  // ── Helpers ──────────────────────────────────────────────────

  private collectInputData(
    nodeId: string,
    graph: ExecutionGraph,
    dataStore: Map<string, unknown>,
  ): Record<string, unknown> {
    const inputs: Record<string, unknown> = {}
    for (const edge of graph.edges) {
      if (edge.target === nodeId) {
        const key = edge.sourceHandle ?? edge.source
        inputs[key] = dataStore.get(edge.source)
      }
    }
    // Also pass trigger data
    const trigger = dataStore.get('__trigger__')
    if (trigger !== undefined) inputs['__trigger__'] = trigger
    return inputs
  }

  private addSubtreeToSkip(
    startId: string,
    graph: ExecutionGraph,
    skipSet: Set<string>,
  ): void {
    if (skipSet.has(startId)) return
    skipSet.add(startId)
    for (const next of graph.adjacency.get(startId) ?? []) {
      this.addSubtreeToSkip(next, graph, skipSet)
    }
  }

  private async log(
    runId: string,
    nodeId: string | null,
    nodeLabel: string | null,
    level: ExecutionLog['level'],
    message: string,
    data?: unknown,
    durationMs?: number,
  ): Promise<void> {
    try {
      await this.logRepo.save(this.logRepo.create({
        runId, nodeId, nodeLabel, level, message,
        data:       data !== undefined ? (data as Record<string, unknown>) : null,
        durationMs: durationMs ?? null,
      }))
    } catch { /* non-fatal */ }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Node timed out after ${ms}ms`)), ms),
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }
}
