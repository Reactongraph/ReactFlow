import { useEffect, useRef } from 'react'
import { useFlowStore } from '../store'

// Auto-validates on every node/edge change, debounced to avoid thrashing
export const useValidation = () => {
  const nodes = useFlowStore(s => s.nodes)
  const edges = useFlowStore(s => s.edges)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      useFlowStore.getState().validateWorkflow()
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [nodes, edges])
}
