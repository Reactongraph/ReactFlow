import { StateCreator } from 'zustand'
import { FlowState, ValidationError } from '../../types'

export const createValidationSlice: StateCreator<FlowState, [], [], Pick<FlowState, 'validation' | 'validateWorkflow'>> = (set, get) => ({
  validation: {
    errors: [],
  },

  validateWorkflow: () => {
    const currentState = get()
    const errors: ValidationError[] = []

    // Check input nodes have no incoming edges
    currentState.nodes.forEach(node => {
      if (node.type === 'input') {
        const hasIncoming = currentState.edges.some(edge => edge.target === node.id)
        if (hasIncoming) {
          errors.push({
            id: 'input-incoming-' + node.id,
            type: 'node',
            message: 'Input nodes cannot have incoming edges',
            nodeId: node.id,
          })
        }
      }

      // Check output nodes have no outgoing edges
      if (node.type === 'output') {
        const hasOutgoing = currentState.edges.some(edge => edge.source === node.id)
        if (hasOutgoing) {
          errors.push({
            id: 'output-outgoing-' + node.id,
            type: 'node',
            message: 'Output nodes cannot have outgoing edges',
            nodeId: node.id,
          })
        }
      }
    })

    set(() => ({
      validation: {
        errors,
      },
    }))

    return errors
  },
})
