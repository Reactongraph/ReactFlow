import { StateCreator } from 'zustand'
import { FlowState, ValidationError } from '../../types'
import { getNode, getAllNodes } from '../../nodes/registry'

// ── Registry-aware node role helpers ──────────────────────────

/** A trigger node has no input ports — it starts a workflow */
function isTriggerNode(type: string): boolean {
  const def = getNode(type)
  if (def) return def.inputs.length === 0
  // Legacy fallback
  return type === 'input'
}

/** A terminal node has no output ports — it ends a workflow */
function isTerminalNode(type: string): boolean {
  const def = getNode(type)
  if (def) return def.outputs.length === 0
  // Legacy fallback
  return type === 'output'
}

/** A node that requires at least one incoming edge */
function requiresInput(type: string): boolean {
  const def = getNode(type)
  if (def) return def.inputs.length > 0
  return type !== 'input'
}

/** A node that requires at least one outgoing edge */
function requiresOutput(type: string): boolean {
  const def = getNode(type)
  if (def) return def.outputs.length > 0
  return type !== 'output'
}

// ── Build human-readable lists of trigger/terminal type names ──

function getTriggerTypeNames(): string {
  const names = getAllNodes()
    .filter(d => d.inputs.length === 0)
    .map(d => d.name)
  return names.length ? names.join(', ') : 'Input, Webhook Trigger, Schedule, Manual Trigger…'
}

function getTerminalTypeNames(): string {
  const names = getAllNodes()
    .filter(d => d.outputs.length === 0)
    .map(d => d.name)
  return names.length ? names.join(', ') : 'Output, Webhook Response, Output Viewer…'
}

// ── Validation slice ───────────────────────────────────────────

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

    if (nodes.length === 0) {
      set(() => ({ validation: { errors: [] } }))
      return []
    }

    // ── 1. Workflow-level: must have at least one trigger node ──
    const hasTrigger = nodes.some(n => isTriggerNode(n.type))
    if (!hasTrigger) {
      errors.push({
        id: 'no-trigger',
        type: 'workflow',
        message: `Workflow needs a trigger node to start execution (e.g. ${getTriggerTypeNames()})`,
      })
    }

    // ── 2. Workflow-level: must have at least one terminal node ─
    const hasTerminal = nodes.some(n => isTerminalNode(n.type))
    if (!hasTerminal) {
      errors.push({
        id: 'no-terminal',
        type: 'workflow',
        message: `Workflow needs a terminal node to complete (e.g. ${getTerminalTypeNames()})`,
      })
    }

    // ── 3. Per-node checks ──────────────────────────────────────
    nodes.forEach(node => {
      const def = getNode(node.type)
      const cfg = (node.data.config ?? {}) as Record<string, unknown>

      // Trigger nodes must not have incoming edges
      if (isTriggerNode(node.type) && edges.some(e => e.target === node.id)) {
        errors.push({
          id: `trigger-incoming-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — trigger nodes cannot have incoming connections`,
          nodeId: node.id,
        })
      }

      // Terminal nodes must not have outgoing edges
      if (isTerminalNode(node.type) && edges.some(e => e.source === node.id)) {
        errors.push({
          id: `terminal-outgoing-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — terminal nodes cannot have outgoing connections`,
          nodeId: node.id,
        })
      }

      // Non-trigger nodes with no incoming edges (disconnected input side)
      if (requiresInput(node.type) && nodes.length > 1) {
        const hasIncoming = edges.some(e => e.target === node.id)
        if (!hasIncoming) {
          errors.push({
            id: `no-incoming-${node.id}`,
            type: 'node',
            message: `"${node.data.label}" — has no incoming connection`,
            nodeId: node.id,
          })
        }
      }

      // Non-terminal nodes with no outgoing edges (disconnected output side)
      if (requiresOutput(node.type) && nodes.length > 1) {
        const hasOutgoing = edges.some(e => e.source === node.id)
        if (!hasOutgoing) {
          errors.push({
            id: `no-outgoing-${node.id}`,
            type: 'node',
            message: `"${node.data.label}" — has no outgoing connection`,
            nodeId: node.id,
          })
        }
      }

      // ── Schema-driven required field checks ──────────────────
      if (def) {
        def.fields
          .filter(f => f.required)
          .forEach(f => {
            const val = cfg[f.key]
            const missing = val === undefined || val === null || String(val).trim() === ''
            if (missing) {
              errors.push({
                id: `required-${f.key}-${node.id}`,
                type: 'node',
                message: `"${node.data.label}" — ${f.label} is required`,
                nodeId: node.id,
              })
            }
          })
      }

      // ── Category-specific checks (legacy + plugin nodes) ─────

      // HTTP / API nodes need a URL
      if (
        (node.type === 'api' || node.type === 'http-request' || node.type === 'rest-api') &&
        !String(cfg.url ?? '').trim()
      ) {
        errors.push({
          id: `no-url-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — URL is required`,
          nodeId: node.id,
        })
      }

      // GraphQL needs an endpoint
      if (node.type === 'graphql' && !String(cfg.endpoint ?? '').trim()) {
        errors.push({
          id: `no-endpoint-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — GraphQL endpoint is required`,
          nodeId: node.id,
        })
      }

      // IF / Decision nodes need a condition
      if (
        (node.type === 'decision' || node.type === 'logic-if') &&
        !String(cfg.condition ?? '').trim()
      ) {
        errors.push({
          id: `no-condition-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — condition expression is required`,
          nodeId: node.id,
        })
      }

      // Switch needs an expression
      if (node.type === 'logic-switch' && !String(cfg.expression ?? '').trim()) {
        errors.push({
          id: `no-expression-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — switch expression is required`,
          nodeId: node.id,
        })
      }

      // Schedule trigger needs a cron expression
      if (node.type === 'trigger-schedule' && !String(cfg.cron ?? '').trim()) {
        errors.push({
          id: `no-cron-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — cron expression is required`,
          nodeId: node.id,
        })
      }

      // DB nodes need a connection string / URI
      if (node.type === 'db-postgres' && !String(cfg.connectionString ?? '').trim()) {
        errors.push({
          id: `no-conn-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — connection string is required`,
          nodeId: node.id,
        })
      }
      if (node.type === 'db-mongodb' && !String(cfg.uri ?? '').trim()) {
        errors.push({
          id: `no-uri-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — MongoDB URI is required`,
          nodeId: node.id,
        })
      }
      if (node.type === 'db-redis' && !String(cfg.url ?? '').trim()) {
        errors.push({
          id: `no-redis-url-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — Redis URL is required`,
          nodeId: node.id,
        })
      }

      // Email sender needs from + to + subject
      if (node.type === 'comm-email') {
        if (!String(cfg.from ?? '').trim())
          errors.push({ id: `email-no-from-${node.id}`, type: 'node', message: `"${node.data.label}" — From address is required`, nodeId: node.id })
        if (!String(cfg.to ?? '').trim())
          errors.push({ id: `email-no-to-${node.id}`, type: 'node', message: `"${node.data.label}" — To address is required`, nodeId: node.id })
        if (!String(cfg.subject ?? '').trim())
          errors.push({ id: `email-no-subject-${node.id}`, type: 'node', message: `"${node.data.label}" — Subject is required`, nodeId: node.id })
      }

      // Slack needs a webhook URL
      if (
        (node.type === 'comm-slack' || node.type === 'comm-discord') &&
        !String(cfg.webhookUrl ?? '').trim()
      ) {
        errors.push({
          id: `no-webhook-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — Webhook URL is required`,
          nodeId: node.id,
        })
      }

      // AI nodes need a model selected
      if (
        (node.type === 'ai' || node.type === 'ai-text-gen' ||
         node.type === 'ai-summarize' || node.type === 'ai-classify' ||
         node.type === 'ai-embedding') &&
        !String(cfg.model ?? '').trim()
      ) {
        errors.push({
          id: `no-model-${node.id}`,
          type: 'node',
          message: `"${node.data.label}" — AI model must be selected`,
          nodeId: node.id,
        })
      }
    })

    // ── 4. Edge-level: no self-loops ────────────────────────────
    edges.forEach(edge => {
      if (edge.source === edge.target) {
        errors.push({
          id: `self-loop-${edge.id}`,
          type: 'edge',
          message: 'A node cannot connect to itself',
        })
      }
    })

    set(() => ({ validation: { errors } }))
    return errors
  },
})
