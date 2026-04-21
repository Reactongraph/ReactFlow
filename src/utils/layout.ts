import dagre from 'dagre'
import { CustomNode, Edge } from '../types'

export const autoLayout = (nodes: CustomNode[], edges: Edge[]): CustomNode[] => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 })
  })

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    }
  })
}