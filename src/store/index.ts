import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CustomNode, FlowState, NodeType } from '../types'
import { addEdge, Connection, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow'
import { autoLayout as computeAutoLayout } from '../utils/layout'
import { createHistorySlice } from './slices/history'
import { createClipboardSlice } from './slices/clipboard'
import { createTemplateSlice } from './slices/templates'
import { createValidationSlice } from './slices/validation'

const initialNodes: CustomNode[] = []
const initialEdges: Edge[] = []

export const useFlowStore = create<FlowState>()(
  persist(
    (...a) => ({
      ...createHistorySlice(...a),
      ...createClipboardSlice(...a),
      ...createTemplateSlice(...a),
      ...createValidationSlice(...a),
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,

      onNodesChange: (changes: NodeChange[]) => {
        const [set, get] = a
        const currentState = get()
        const newNodes = applyNodeChanges(changes, currentState.nodes) as CustomNode[]
        set({
          nodes: newNodes,
        })
        currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        const [set, get] = a
        const currentState = get()
        const newEdges = applyEdgeChanges(changes, currentState.edges) as Edge[]
        set({
          edges: newEdges,
        })
        currentState.addToHistory({ nodes: currentState.nodes, edges: newEdges })
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
        const { nodes, edges } = get()
        return JSON.stringify({ nodes, edges })
      },

      importWorkflow: (json: string) => {
        const [set, get] = a
        const currentState = get()
        const { nodes, edges } = JSON.parse(json) as { nodes: CustomNode[]; edges: Edge[] }
        set({ nodes, edges })
        currentState.addToHistory({ nodes, edges })
      },

      onConnect: (connection: Connection) => {
        const [set, get] = a
        const currentState = get()
        const newEdges = addEdge(connection, currentState.edges)
        set({
          edges: newEdges,
        })
        currentState.addToHistory({ nodes: currentState.nodes, edges: newEdges })
      },

      addNode: (type: NodeType, position) => {
        const [set, get] = a
        const currentState = get()
        const id = `${type}-${Date.now()}`
        const newNode: CustomNode = {
          id,
          type,
          position,
          data: {
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
            properties: {},
          },
        }
        const newNodes = [...currentState.nodes, newNode]
        set({
          nodes: newNodes,
        })
        currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
      },

      deleteNode: (id: string) => {
        const [set, get] = a
        const currentState = get()
        const newNodes = currentState.nodes.filter((node) => node.id !== id)
        const newEdges = currentState.edges.filter(
          (edge) => edge.source !== id && edge.target !== id
        )
        set({
          nodes: newNodes,
          edges: newEdges,
          selectedNodeId: currentState.selectedNodeId === id ? null : currentState.selectedNodeId,
        })
        currentState.addToHistory({ nodes: newNodes, edges: newEdges })
      },

      updateNode: (id: string, updates: Partial<CustomNode>) => {
        const [set, get] = a
        const currentState = get()
        const newNodes = currentState.nodes.map((node) =>
          node.id === id ? { ...node, ...updates } : node
        )
        set({
          nodes: newNodes,
        })
        currentState.addToHistory({ nodes: newNodes, edges: currentState.edges })
      },

      setSelectedNode: (id: string | null) => {
        const [set] = a
        set({ selectedNodeId: id })
      },

      resetFlow: () => {
        const [set, get] = a
        const currentState = get()
        set({
          nodes: initialNodes,
          edges: initialEdges,
          selectedNodeId: null,
        })
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
      },
    }),
    {
      name: 'flow-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        templates: state.templates,
      }),
    }
  )
)