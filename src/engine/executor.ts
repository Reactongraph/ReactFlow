import { CustomNode, Edge, ExecutionLogEntry, ExecutionLogType } from '../types'
import { getNode } from '../nodes/registry'

// ── Topological sort (Kahn's algorithm) ───────────────────────

export function buildExecutionOrder(nodes: CustomNode[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    adjacency.get(edge.source)?.push(edge.target)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  // Prioritize trigger nodes first
  queue.sort((a, b) => {
    const na = nodes.find(n => n.id === a)
    const nb = nodes.find(n => n.id === b)
    const aIsTrigger = na?.type === 'input' || na?.type?.startsWith('trigger-')
    const bIsTrigger = nb?.type === 'input' || nb?.type?.startsWith('trigger-')
    if (aIsTrigger && !bIsTrigger) return -1
    if (bIsTrigger && !aIsTrigger) return 1
    return 0
  })

  const order: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    order.push(nodeId)
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  // If there are nodes not reached (disconnected), append them
  for (const node of nodes) {
    if (!order.includes(node.id)) order.push(node.id)
  }

  return order
}

// ── Find edges leading into a node ────────────────────────────

export function getIncomingEdgeIds(nodeId: string, edges: Edge[]): string[] {
  return edges.filter(e => e.target === nodeId).map(e => e.id)
}

// ── Per-node execution ────────────────────────────────────────
const DELAY_RANGES: Record<string, [number, number]> = {
  input:      [200, 500],
  api:        [700, 1400],
  transform:  [300, 700],
  decision:   [250, 500],
  ai:         [900, 1800],
  processing: [400, 900],
  output:     [200, 450],
}

const MOCK_OUTPUTS: Record<string, unknown> = {
  input: {
    data: [
      { id: 1, name: 'Alpha', value: 42, active: true },
      { id: 2, name: 'Beta',  value: 87, active: false },
      { id: 3, name: 'Gamma', value: 13, active: true },
    ],
    count: 3,
    source: 'trigger',
  },
  api: {
    status: 200,
    ok: true,
    data: { users: 142, events: 7891 },
    latency: '84ms',
  },
  transform: {
    transformed: [
      { id: 1, name: 'Alpha', computed: 84  },
      { id: 2, name: 'Beta',  computed: 174 },
    ],
    dropped: 1,
  },
  decision: { branch: 'yes', condition: true, evaluated: 'data.value > 30' },
  ai: {
    response: 'Positive sentiment detected. Confidence: 92%. Recommend proceeding.',
    tokens: 143,
    model: 'claude-3-sonnet',
    latency: '1.2s',
  },
  processing: { processed: 3, failed: 0, duration: '52ms', records: 3 },
  output:     { delivered: true, format: 'json', destination: 'webhook', bytes: 1280 },
}

export function simulateNodeExecution(
  nodeType: string,
  config: Record<string, unknown>,
  input: unknown,
  signal: AbortSignal,
  nodeId: string,
  nodeLabel: string,
): Promise<{ output: unknown; duration: number }> {
  const def = getNode(nodeType)

  if (def) {
    const start = Date.now()
    return def.executor(config, input, { nodeId, nodeLabel, signal }).then(output => ({
      output,
      duration: Date.now() - start,
    }))
  }

  // Fallback for legacy built-in types
  const [min, max] = DELAY_RANGES[nodeType] ?? [300, 800]
  const duration = min + Math.random() * (max - min)
  return new Promise(resolve =>
    setTimeout(() => {
      resolve({ output: MOCK_OUTPUTS[nodeType] ?? { result: 'ok' }, duration })
    }, duration),
  )
}

// ── Log entry factory ─────────────────────────────────────────

export function createLogEntry(
  nodeId: string,
  nodeLabel: string,
  type: ExecutionLogType,
  message: string,
  data?: unknown,
  duration?: number,
): ExecutionLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    nodeId,
    nodeLabel,
    type,
    message,
    data,
    duration,
  }
}
