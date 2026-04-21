import { StateCreator } from 'zustand'
import { FlowState, FlowSnapshot } from '../../types'

export const createHistorySlice: StateCreator<FlowState, [], [], Pick<FlowState, 'history' | 'undo' | 'redo' | 'addToHistory'>> = (set, get) => ({
  history: {
    past: [],
    future: [],
  },

  addToHistory: (snapshot: FlowSnapshot) => {
    set((state) => ({
      history: {
        past: [...state.history.past, snapshot],
        future: [],
      },
    }))
  },

  undo: () => {
    const currentState = get()
    if (currentState.history.past.length > 0) {
      const previous = currentState.history.past[currentState.history.past.length - 1]
      const newPast = currentState.history.past.slice(0, -1)
      set(() => ({
        nodes: previous.nodes,
        edges: previous.edges,
        history: {
          past: newPast,
          future: [currentState.history.future[0], ...currentState.history.future],
        },
      }))
    }
  },

  redo: () => {
    const currentState = get()
    if (currentState.history.future.length > 0) {
      const next = currentState.history.future[0]
      const newFuture = currentState.history.future.slice(1)
      set(() => ({
        nodes: next.nodes,
        edges: next.edges,
        history: {
          past: [...currentState.history.past, currentState.history.future[0]],
          future: newFuture,
        },
      }))
    }
  },
})