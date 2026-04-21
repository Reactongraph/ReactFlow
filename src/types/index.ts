import { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow'

export type NodeType = 'input' | 'processing' | 'output'

export interface CustomNode extends Node {
  type: NodeType
  data: {
    label: string
    properties?: Record<string, unknown>
  }
}

export interface FlowState {
  nodes: CustomNode[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  deleteNode: (id: string) => void
  updateNode: (id: string, updates: Partial<CustomNode>) => void
  setSelectedNode: (id: string | null) => void
  resetFlow: () => void
  // New additions
  history: HistoryState
  clipboard: ClipboardState
  templates: TemplateState
  validation: ValidationState
  undo: () => void
  redo: () => void
  copyNodes: () => void
  pasteNodes: (position?: { x: number; y: number }) => void
  duplicateNode: () => void
  saveTemplate: (node: CustomNode) => void
  createFromTemplate: (templateId: string, position: { x: number; y: number }) => void
  autoLayout: () => void
  exportWorkflow: () => string
  importWorkflow: (json: string) => void
  validateWorkflow: () => ValidationError[]
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

export interface TemplateState {
  templates: Record<string, CustomNode>
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