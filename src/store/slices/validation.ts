import { StateCreator } from 'zustand'
import { FlowState, ValidationError } from '../../types'

export const createValidationSlice: StateCreator<
  FlowState,
  [],
  [],
  Pick<FlowState, 'validation' | 'validateWorkflow'>
> = (set, get) => ({
  validation: { errors: [] },

  validateWorkflow: () => {
    const { nodes, edges } = get()
    const errors: ValidationError[] = []

    // Must have at least one input and one output
    const hasInput  = nodes.some(n => n.type === 'input')
    const hasOutput = nodes.some(n => n.type === 'output')
    if (!hasInput)  errors.push({ id: 'no-input',  type: 'workflow', message: 'Workflow must have at least one Input node' })
    if (!hasOutput) errors.push({ id: 'no-output', type: 'workflow', message: 'Workflow must have at least one Output node' })

    nodes.forEach(node => {
      // Input nodes must not have incoming edges
      if (node.type === 'input' && edges.some(e => e.target === node.id)) {
        errors.push({ id: `input-incoming-${node.id}`, type: 'node', message: `"${node.data.label}" — Input nodes cannot have incoming connections`, nodeId: node.id })
      }
      // Output nodes must not have outgoing edges
      if (node.type === 'output' && edges.some(e => e.source === node.id)) {
        errors.push({ id: `output-outgoing-${node.id}`, type: 'node', message: `"${node.data.label}" — Output nodes cannot have outgoing connections`, nodeId: node.id })
      }
      // API nodes must have a URL configured
      if (node.type === 'api' && !node.data.config?.url?.trim()) {
        errors.push({ id: `api-no-url-${node.id}`, type: 'node', message: `"${node.data.label}" — API node is missing a URL`, nodeId: node.id })
      }
      // Decision nodes must have a condition
      if (node.type === 'decision' && !node.data.config?.condition?.trim()) {
        errors.push({ id: `decision-no-cond-${node.id}`, type: 'node', message: `"${node.data.label}" — Decision node is missing a condition`, nodeId: node.id })
      }
      // Disconnected nodes (no edges at all) except input/output
      const connected = edges.some(e => e.source === node.id || e.target === node.id)
      if (!connected && nodes.length > 1) {
        errors.push({ id: `disconnected-${node.id}`, type: 'node', message: `"${node.data.label}" — Node is disconnected from the workflow`, nodeId: node.id })
      }
    })

    set(() => ({ validation: { errors } }))
    return errors
  },
})
