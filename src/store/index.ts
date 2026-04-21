import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CustomNode, FlowState, NodeType } from '../types'
import { addEdge, Connection, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow'
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
        const newNodes = applyNodeChanges(changes, currentState.nodes)
        set((state) => ({
          nodes: newNodes,
        }))
        // Add to history
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        const [set, get] = a
        const currentState = get()
        const newEdges = applyEdgeChanges(changes, currentState.edges)
        set((state) => ({
          edges: newEdges,
        }))
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
      },

      onConnect: (connection: Connection) => {
        const [set, get] = a
        const currentState = get()
        const newEdges = addEdge(connection, currentState.edges)
        set((state) => ({
          edges: newEdges,
        }))
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
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
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }))
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
      },

      deleteNode: (id: string) => {
        const [set, get] = a
        const currentState = get()
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }))
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
      },

      updateNode: (id: string, updates: Partial<CustomNode>) => {
        const [set, get] = a
        const currentState = get()
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, ...updates } : node
          ),
        }))
        currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
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