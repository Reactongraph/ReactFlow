import { CustomNode, Edge } from '../types'

export interface WorkflowData {
  nodes: CustomNode[]
  edges: Edge[]
  version: string
}

export const exportWorkflow = (nodes: CustomNode[], edges: Edge[]): string => {
  const data: WorkflowData = {
    nodes,
    edges,
    version: '1.0',
  }
  return JSON.stringify(data, null, 2)
}

export const importWorkflow = (json: string): { nodes: CustomNode[], edges: Edge[] } => {
  try {
    const data: WorkflowData = JSON.parse(json)
    if (data.version !== '1.0') {
      throw new Error('Unsupported workflow version')
    }
    return { nodes: data.nodes, edges: data.edges }
  } catch (error) {
    throw new Error('Invalid workflow JSON')
  }
}