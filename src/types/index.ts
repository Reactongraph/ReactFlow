import { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow'

export type { Edge } from 'reactflow'

export type NodeType =
  | 'input'
  | 'output'
  | 'processing'
  | 'api'
  | 'transform'
  | 'decision'
  | 'ai'

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning'

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

export interface FlowState {
  workflowName: string
  nodes: CustomNode[]
  edges: Edge[]
  selectedNodeId: string | null

  // Workflow name
  setWorkflowName: (name: string) => void

  // Core flow
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType, position: { x: number; y: number }) => void
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

  // Validation
  validation: ValidationState
  validateWorkflow: () => ValidationError[]

  // Layout / IO
  autoLayout: () => void
  exportWorkflow: () => string
  importWorkflow: (json: string) => void
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
