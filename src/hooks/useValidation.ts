import { useEffect } from 'react'
import { useFlowStore } from '../store'

export const useValidation = () => {
  const { validateWorkflow, nodes, edges } = useFlowStore()

  useEffect(() => {
    validateWorkflow()
  }, [nodes, edges, validateWorkflow])
}