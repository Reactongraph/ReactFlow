import { Node, Edge, NodeChange, EdgeChange, Connection, ReactFlowInstance } from 'reactflow'

export type { Edge } from 'reactflow'

/** Legacy built-in types + any registered plugin type */
export type NodeType = string

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning'

export type ExecutionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'completed'
  | 'failed'

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL'

export interface NodeConfig {
  // Input
  dataType?: 'json' | 'csv' | 'text' | 'number' | 'boolean'
  sampleData?: string
  // API
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: string
  body?: string
  timeout?: number
  // Transform
  transformType?: 'map' | 'filter' | 'reduce' | 'aggregate' | 'custom'
  transformCode?: string
  // Decision
  condition?: string
  trueLabel?: string
  falseLabel?: string
  // AI
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'custom'
  prompt?: string
  maxTokens?: number
  temperature?: number
  // Output
  format?: 'json' | 'csv' | 'html' | 'text'
  destination?: string
  // Processing
  processingType?: 'aggregate' | 'validate' | 'enrich' | 'normalize'
  script?: string
}

export interface NodeData {
  label: string
  description?: string
  status?: NodeStatus
  config?: NodeConfig
  properties?: Record<string, unknown>
}

export interface CustomNode extends Node {
  type: NodeType
  data: NodeData
}

// ── Execution ──────────────────────────────────────────────────

export type ExecutionLogType = 'info' | 'success' | 'error' | 'warning'

export interface ExecutionLogEntry {
  id: string
  timestamp: number
  nodeId: string
  nodeLabel: string
  type: ExecutionLogType
  message: string
  data?: unknown
  duration?: number
}

export interface NodeExecutionResult {
  nodeId: string
  status: 'success' | 'error' | 'skipped'
  input?: unknown
  output?: unknown
  error?: string
  duration: number
  startedAt: number
}

export interface ExecutionState {
  status: ExecutionStatus
  currentNodeId: string | null
  completedNodes: Set<string>
  failedNodes: Set<string>
  logs: ExecutionLogEntry[]
  results: Record<string, NodeExecutionResult>
  startedAt: number | null
  completedAt: number | null
  activeEdges: Set<string>
  breakpoints: Set<string>
  isStepMode: boolean
}

// ── Run History (client-side) ─────────────────────────────────

export type LocalRunStatus = 'completed' | 'failed'

export interface LocalRunLog {
  id: string
  timestamp: number
  nodeId: string
  nodeLabel: string
  type: ExecutionLogType
  message: string
  duration?: number
}

export interface LocalRun {
  id: string
  workflowName: string
  status: LocalRunStatus
  startedAt: number
  completedAt: number
  durationMs: number
  nodeCount: number
  completedNodes: number
  failedNodes: number
  logs: LocalRunLog[]
  nodeResults: Record<string, { status: string; duration: number; error?: string }>
}

// ── Workflow Templates (multi-node) ──────────────────────────

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: CustomNode[]
  edges: Edge[]
}

// ── Versions ───────────────────────────────────────────────────

export interface WorkflowVersion {
  id: string
  name: string
  description?: string
  createdAt: number
  nodes: CustomNode[]
  edges: Edge[]
  workflowName: string
}

// ── Flow state ─────────────────────────────────────────────────

export interface FlowState {
  workflowName: string
  savedWorkflowId: string | null        // backend UUID once saved
  nodes: CustomNode[]
  edges: Edge[]
  selectedNodeId: string | null

  // ReactFlow instance (for fitView / project)
  rfInstance: ReactFlowInstance | null
  setRfInstance: (inst: ReactFlowInstance) => void

  // Workflow name + backend sync
  setWorkflowName: (name: string) => void
  setSavedWorkflowId: (id: string | null) => void
  saveWorkflowToBackend: () => Promise<string>

  // Core flow
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: string, position: { x: number; y: number }) => void
  deleteNode: (id: string) => void
  updateNode: (id: string, updates: Partial<CustomNode>) => void
  setSelectedNode: (id: string | null) => void
  resetFlow: () => void

  // History
  history: HistoryState
  undo: () => void
  redo: () => void
  addToHistory: (snapshot: FlowSnapshot) => void

  // Clipboard
  clipboard: ClipboardState
  copyNodes: () => void
  pasteNodes: (position?: { x: number; y: number }) => void
  duplicateNode: () => void

  // Templates
  templates: Record<string, CustomNode>
  saveTemplate: (node: CustomNode) => void
  createFromTemplate: (templateId: string, position: { x: number; y: number }) => void

  // Workflow Templates (multi-node, read-only presets)
  workflowTemplates: WorkflowTemplate[]
  loadWorkflowTemplate: (id: string) => void

  // Validation
  validation: ValidationState
  validateWorkflow: () => ValidationError[]

  // Layout / IO
  autoLayout: (direction?: LayoutDirection) => void
  exportWorkflow: () => string
  importWorkflow: (json: string) => void

  // Execution
  execution: ExecutionState
  startExecution: () => Promise<void>
  pauseExecution: () => void
  resumeExecution: () => void
  stopExecution: () => void
  stepExecution: () => void
  toggleBreakpoint: (nodeId: string) => void
  clearExecutionLogs: () => void

  // Run History (client-side)
  runHistory: LocalRun[]
  clearRunHistory: () => void

  // Versions
  versions: WorkflowVersion[]
  saveVersion: (name?: string) => void
  restoreVersion: (id: string) => void
  deleteVersion: (id: string) => void
}

export interface HistoryState {
  past: FlowSnapshot[]
  future: FlowSnapshot[]
}

export interface FlowSnapshot {
  nodes: CustomNode[]
  edges: Edge[]
}

export interface ClipboardState {
  nodes: CustomNode[]
  edges: Edge[]
}

export interface ValidationState {
  errors: ValidationError[]
}

export interface ValidationError {
  id: string
  type: 'node' | 'edge' | 'workflow'
  message: string
  nodeId?: string
  edgeId?: string
}

export interface NodeCategoryDef {
  category: string
  nodes: NodeDef[]
}

export interface NodeDef {
  type: NodeType
  label: string
  description: string
  color: string
}

// Re-export registry types for convenience
export type { NodeDefinition, NodeCategory, FieldSchema, FieldType } from '../nodes/registry/types'
