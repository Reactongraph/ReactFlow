import { StateCreator } from 'zustand'
import { FlowState } from '../../types'

export const createClipboardSlice: StateCreator<FlowState, [], [], Pick<FlowState, 'clipboard' | 'copyNodes' | 'pasteNodes' | 'duplicateNode'>> = (set, get) => ({
  clipboard: {
    nodes: [],
    edges: [],
  },

  copyNodes: () => {
    const currentState = get()
    const selectedNodes = currentState.nodes.filter(node => node.selected)
    const selectedEdges = currentState.edges.filter(edge =>
      selectedNodes.some(node => node.id === edge.source) &&
      selectedNodes.some(node => node.id === edge.target)
    )
    set(() => ({
      clipboard: {
        nodes: selectedNodes,
        edges: selectedEdges,
      },
    }))
  },

  pasteNodes: (position) => {
    const currentState = get()
    if (currentState.clipboard.nodes.length === 0) return

    const offset = position || { x: 50, y: 50 }
    const newNodes = currentState.clipboard.nodes.map(node => ({
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: false,
    }))
    const newEdges = currentState.clipboard.edges.map(edge => ({
      ...edge,
      id: `${edge.id}-copy-${Date.now()}`,
      source: edge.source.replace(/-\d+$/, `-copy-${Date.now()}`),
      target: edge.target.replace(/-\d+$/, `-copy-${Date.now()}`),
    }))

    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
      edges: [...state.edges, ...newEdges],
    }))
    currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
  },

  duplicateNode: () => {
    const currentState = get()
    if (!currentState.selectedNodeId) return
    const selectedNode = currentState.nodes.find(node => node.id === currentState.selectedNodeId)
    if (!selectedNode) return
    currentState.pasteNodes({
      x: selectedNode.position.x + 100,
      y: selectedNode.position.y + 100,
    })
  },
})