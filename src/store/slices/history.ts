import { StateCreator } from 'zustand'
import { FlowState, FlowSnapshot } from '../../types'

const MAX_HISTORY = 50

export const createHistorySlice: StateCreator<
  FlowState,
  [],
  [],
  Pick<FlowState, 'history' | 'undo' | 'redo' | 'addToHistory'>
> = (set, get) => ({
  history: { past: [], future: [] },

  addToHistory: (snapshot: FlowSnapshot) => {
    set((state) => ({
      history: {
        past: [...state.history.past.slice(-MAX_HISTORY), snapshot],
        future: [],
      },
    }))
  },

  undo: () => {
    const { history, nodes, edges } = get()
    if (history.past.length === 0) return
    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    set(() => ({
      nodes: previous.nodes,
      edges: previous.edges,
      history: {
        past: newPast,
        // push current state to future (not future[0] — that was the old bug)
        future: [{ nodes, edges }, ...history.future],
      },
    }))
  },

  redo: () => {
    const { history, nodes, edges } = get()
    if (history.future.length === 0) return
    const next = history.future[0]
    const newFuture = history.future.slice(1)
    set(() => ({
      nodes: next.nodes,
      edges: next.edges,
      history: {
        past: [...history.past, { nodes, edges }],
        future: newFuture,
      },
    }))
  },
})
