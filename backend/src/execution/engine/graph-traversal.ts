import { WorkflowNodeData, WorkflowEdgeData } from '../../workflows/entities/workflow.entity'

export interface ExecutionGraph {
  nodes: WorkflowNodeData[]
  edges: WorkflowEdgeData[]
  /** Adjacency list: nodeId → [nextNodeId, ...] */
  adjacency: Map<string, string[]>
  /** For decision nodes: nodeId → Map<handleId, nextNodeId> */
  branchMap: Map<string, Map<string, string>>
  /** Topologically sorted node IDs */
  order: string[]
  /** Map for quick node lookup */
  nodeMap: Map<string, WorkflowNodeData>
}

/**
 * Build a traversal graph from raw nodes + edges using Kahn's algorithm.
 * Input nodes (no incoming edges) are sorted first.
 */
export function buildGraph(
  nodes: WorkflowNodeData[],
  edges: WorkflowEdgeData[],
): ExecutionGraph {
  const nodeMap   = new Map(nodes.map(n => [n.id, n]))
  const adjacency = new Map<string, string[]>()
  const branchMap = new Map<string, Map<string, string>>()
  const inDegree  = new Map<string, number>()

  for (const n of nodes) {
    adjacency.set(n.id, [])
    inDegree.set(n.id, 0)
  }

  for (const e of edges) {
    const src = e.source
    const tgt = e.target

    // Simple adjacency
    adjacency.get(src)?.push(tgt)

    // Branch map for sourceHandle-aware routing (decision nodes)
    if (e.sourceHandle) {
      if (!branchMap.has(src)) branchMap.set(src, new Map())
      branchMap.get(src)!.set(e.sourceHandle, tgt)
    }

    inDegree.set(tgt, (inDegree.get(tgt) ?? 0) + 1)
  }

  // Kahn's topological sort — prioritize input nodes first
  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      const node = nodeMap.get(id)
      if (node?.type === 'input') queue.unshift(id) // inputs first
      else queue.push(id)
    }
  }

  const order: string[] = []
  const visited = new Set(queue)

  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)

    for (const next of adjacency.get(id) ?? []) {
      const newDeg = (inDegree.get(next) ?? 1) - 1
      inDegree.set(next, newDeg)
      if (newDeg === 0 && !visited.has(next)) {
        visited.add(next)
        queue.push(next)
      }
    }
  }

  // Append any disconnected nodes (not reachable from inputs)
  for (const n of nodes) {
    if (!visited.has(n.id)) order.push(n.id)
  }

  return { nodes, edges, adjacency, branchMap, order, nodeMap }
}

/** Returns the next node IDs to execute given the current node's output branchId */
export function resolveNextNodes(
  graph: ExecutionGraph,
  nodeId: string,
  branchId?: string,
): string[] {
  const branches = graph.branchMap.get(nodeId)

  // Decision node with a chosen branch
  if (branches && branchId) {
    const next = branches.get(branchId)
    return next ? [next] : []
  }

  // Regular node — all outgoing edges
  return graph.adjacency.get(nodeId) ?? []
}
