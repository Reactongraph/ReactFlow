/** Logger interface injected into every node execution context */
export interface ExecutionLogger {
  info:    (message: string, data?: unknown) => void | Promise<void>
  success: (message: string, data?: unknown) => void | Promise<void>
  warn:    (message: string, data?: unknown) => void | Promise<void>
  error:   (message: string, data?: unknown) => void | Promise<void>
}

/** Full execution context passed to each node handler */
export interface NodeExecutionContext {
  nodeId:    string
  nodeType:  string
  /** Node config (from the React Flow node `config` field) */
  config:    Record<string, unknown>
  /** Node data (label, description, etc.) */
  data:      Record<string, unknown>
  /** Outputs from upstream nodes (keyed by sourceHandle or source nodeId) */
  inputData: Record<string, unknown>
  runId:     string
  userId:    string
  logger:    ExecutionLogger
}

/** Output returned by every node handler */
export interface NodeHandlerOutput {
  /** Payload passed to downstream nodes */
  data?: unknown
  /** For decision/branch nodes — which branch to follow */
  branchId?: string
}

/** Every node type must implement this interface */
export abstract class BaseNodeHandler {
  /** The node type string this handler handles, e.g. 'api', 'ai', 'transform' */
  abstract readonly nodeType: string

  /** Execute the node and return output data */
  abstract execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput>

  /** Human-readable description of this node type */
  get description(): string {
    return `${this.nodeType} node`
  }

  /** Convenience: extract typed config value */
  protected cfg<T>(ctx: NodeExecutionContext, key: string, fallback?: T): T {
    return (ctx.config[key] ?? ctx.data[key] ?? fallback) as T
  }

  /** First input value (most nodes only care about one upstream) */
  protected primaryInput(ctx: NodeExecutionContext): unknown {
    const vals = Object.values(ctx.inputData).filter(v => v !== undefined && v !== ctx.inputData['__trigger__'])
    return vals[0]
  }
}
