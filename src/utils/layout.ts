import dagre from 'dagre'
import { CustomNode, Edge, LayoutDirection } from '../types'

const NODE_WIDTH  = 200
const NODE_HEIGHT = 80

export const autoLayout = (
  nodes: CustomNode[],
  edges: Edge[],
  direction: LayoutDirection = 'LR',
): CustomNode[] => {
  if (nodes.length === 0) return nodes

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: direction,
    ranksep: direction === 'TB' || direction === 'BT' ? 80  : 120,
    nodesep: direction === 'TB' || direction === 'BT' ? 60  : 50,
    marginx:  20,
    marginy:  20,
  })

  nodes.forEach(node => graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach(edge => graph.setEdge(edge.source, edge.target))

  dagre.layout(graph)

  return nodes.map(node => {
    const { x, y, width, height } = graph.node(node.id)
    return {
      ...node,
      position: {
        x: x - width  / 2,
        y: y - height / 2,
      },
    }
  })
}
