import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CustomNode, FlowState, NodeType, NodeData } from '../types'
import {
  addEdge,
  Connection,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  NodePositionChange,
} from 'reactflow'
import { autoLayout as computeAutoLayout } from '../utils/layout'
import { createHistorySlice } from './slices/history'
import { createClipboardSlice } from './slices/clipboard'
import { createTemplateSlice } from './slices/templates'
import { createValidationSlice } from './slices/validation'

const NODE_LABELS: Record<NodeType, string> = {
  input:      'Input',
  output:     'Output',
  processing: 'Processing',
  api:        'API Call',
  transform:  'Transform',
  decision:   'Decision',
  ai:         'AI Node',
}

const initialNodes: CustomNode[] = []
const initialEdges: Edge[] = []

export const useFlowStore = create<FlowState>()(
  persist(
    (...a) => ({
      ...createHistorySlice(...a),
      ...createClipboardSlice(...a),
      ...createTemplateSlice(...a),
      ...createValidationSlice(...a),

      workflowName: 'Untitled Workflow',
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,

      setWorkflowName: (name: string) => {
        const [set] = a
        set({ workflowName: name })
      },

      onNodesChange: (changes: NodeChange[]) => {
        const [set, get] = a
        const currentState = get()
        const newNodes = applyNodeChanges(changes, currentState.nodes) as CustomNode[]
        set({ nodes: newNodes })

        // Only record history on meaningful changes (not mid-drag positions or selections)
        const isSignificant = changes.some(c => {
          if (c.type === 'remove') return true
          if (c.type === 'position') return !(c as NodePositionChange).dragging
          return false
        })
        if (isSignificant) {
          currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
        }
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        const [set, get] = a
        const currentState = get()
        const newEdges = applyEdgeChanges(changes, currentState.edges) as Edge[]
        set({ edges: newEdges })
        if (changes.some(c => c.type === 'remove')) {
          currentState.addToHistory({ nodes: currentState.nodes, edges: newEdges })
        }
      },

      onConnect: (connection: Connection) => {
        const [set, get] = a
        const currentState = get()
        const newEdges = addEdge(
          { ...connection, type: 'smoothstep', animated: false },
          currentState.edges,
        )
        set({ edges: newEdges })
        currentState.addToHistory({ nodes: currentState.nodes, edges: newEdges })
      },

      addNode: (type: NodeType, position) => {
        const [set, get] = a
        const currentState = get()
        const id = `${type}-${Date.now()}`
        const data: NodeData = {
          label: NODE_LABELS[type],
          description: '',
          status: 'idle',
          config: {},
        }
        const newNode: CustomNode = { id, type, position, data }
        const newNodes = [...currentState.nodes, newNode]
        set({ nodes: newNodes })
        currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
      },

      deleteNode: (id: string) => {
        const [set, get] = a
        const currentState = get()
        const newNodes = currentState.nodes.filter(n => n.id !== id)
        const newEdges = currentState.edges.filter(e => e.source !== id && e.target !== id)
        set({ nodes: newNodes, edges: newEdges, selectedNodeId: currentState.selectedNodeId === id ? null : currentState.selectedNodeId })
        currentState.addToHistory({ nodes: newNodes, edges: newEdges })
      },

      updateNode: (id: string, updates: Partial<CustomNode>) => {
        const [set, get] = a
        const currentState = get()
        const newNodes = currentState.nodes.map(n =>
          n.id === id ? { ...n, ...updates, data: { ...n.data, ...(updates.data ?? {}) } } : n,
        )
        set({ nodes: newNodes })
        currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
      },

      setSelectedNode: (id: string | null) => {
        const [set] = a
        set({ selectedNodeId: id })
      },

      resetFlow: () => {
        const [set, get] = a
        const currentState = get()
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
        set({ nodes: initialNodes, edges: initialEdges, selectedNodeId: null })
      },

      autoLayout: () => {
        const [set, get] = a
        const currentState = get()
        const newNodes = computeAutoLayout(currentState.nodes, currentState.edges)
        set({ nodes: newNodes })
        currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
      },

      exportWorkflow: () => {
        const [, get] = a
        const { nodes, edges, workflowName } = get()
        return JSON.stringify({ version: '2.0', workflowName, nodes, edges }, null, 2)
      },

      importWorkflow: (json: string) => {
        const [set, get] = a
        const currentState = get()
        const data = JSON.parse(json) as { nodes: CustomNode[]; edges: Edge[]; workflowName?: string }
        set({ nodes: data.nodes, edges: data.edges, workflowName: data.workflowName ?? 'Imported Workflow' })
        currentState.addToHistory({ nodes: data.nodes, edges: data.edges })
      },
    }),
    {
      name: 'flow-storage-v2',
      partialize: (state) => ({
        workflowName: state.workflowName,
        nodes: state.nodes,
        edges: state.edges,
        templates: state.templates,
      }),
    },
  ),
)
