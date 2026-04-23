import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CustomNode, FlowState, NodeData, LayoutDirection } from '../types'
import { workflowService } from '../services/workflow.service'
import { getNode } from '../nodes/registry'
import {
  addEdge,
  Connection,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  NodePositionChange,
  ReactFlowInstance,
} from 'reactflow'
import { autoLayout as computeAutoLayout } from '../utils/layout'
import { createHistorySlice }    from './slices/history'
import { createClipboardSlice }  from './slices/clipboard'
import { createTemplateSlice }   from './slices/templates'
import { createValidationSlice } from './slices/validation'
import { createExecutionSlice }  from './slices/execution'
import { createVersionSlice }    from './slices/versions'
import { WORKFLOW_TEMPLATES }    from '../data/workflowTemplates'

// ── Helpers ────────────────────────────────────────────────────

const LEGACY_LABELS: Record<string, string> = {
  input: 'Input', output: 'Output', processing: 'Processing',
  api: 'API Call', transform: 'Transform', decision: 'Decision', ai: 'AI Node',
}

function getNodeLabel(type: string): string {
  const def = getNode(type)
  if (def) return def.name
  return LEGACY_LABELS[type] ?? type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ── User-scoped storage key ────────────────────────────────────
// Reads the logged-in user id from the auth-store so each user
// gets their own isolated localStorage bucket.

function getUserId(): string {
  try {
    const raw = localStorage.getItem('auth-store')
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { user?: { id?: string } } }
      return parsed?.state?.user?.id ?? 'guest'
    }
  } catch { /* */ }
  return 'guest'
}

function storageKey(): string {
  return `flow-storage-v2-${getUserId()}`
}

// ── Default templates (seeded once per user) ───────────────────

function buildDefaultTemplates(): Record<string, CustomNode> {
  const make = (
    type: string, label: string, config: Record<string, unknown>,
  ): CustomNode => ({
    id: `template-${type}-default`,
    type,
    position: { x: 0, y: 0 },
    data: { label, status: 'idle', config, description: '' },
  })

  return {
    'template-trigger-webhook-default': make('trigger-webhook', 'Webhook Trigger', {
      method: 'POST', path: '/webhook/my-flow',
    }),
    'template-http-request-default': make('http-request', 'GET JSON API', {
      method: 'GET', url: 'https://api.example.com/data', timeout: 5000,
    }),
    'template-ai-text-gen-default': make('ai-text-gen', 'GPT-4o Summarizer', {
      model: 'gpt-4o',
      systemPrompt: 'You are a concise summarizer. Return a 3-sentence summary.',
      userPrompt: 'Summarize the following: {{input}}',
      maxTokens: 512, temperature: 0.3,
    }),
    'template-transform-json-default': make('transform-json', 'Pick ID + Name', {
      mode: 'pick', pickKeys: 'id,name,email',
    }),
    'template-comm-slack-default': make('comm-slack', 'Slack Alert', {
      text: '🚀 Workflow completed: {{status}} at {{timestamp}}',
    }),
  }
}

// ── Store factory ──────────────────────────────────────────────

const initialNodes: CustomNode[] = []
const initialEdges: Edge[]       = []

function createStore() {
  return create<FlowState>()(
    persist(
      (...a) => ({
        ...createHistorySlice(...a),
        ...createClipboardSlice(...a),
        ...createTemplateSlice(...a),
        ...createValidationSlice(...a),
        ...createExecutionSlice(...a),
        ...createVersionSlice(...a),

        workflowName:    'Untitled Workflow',
        savedWorkflowId: null,
        nodes:           initialNodes,
        edges:           initialEdges,
        selectedNodeId:  null,
        rfInstance:      null,

        // Workflow templates are static presets — never persisted
        workflowTemplates: WORKFLOW_TEMPLATES,

        loadWorkflowTemplate: (id: string) => {
          const [set, get] = a
          const s = get()
          const tpl = WORKFLOW_TEMPLATES.find(t => t.id === id)
          if (!tpl) return
          s.addToHistory({ nodes: s.nodes, edges: s.edges })
          set({
            nodes:        tpl.nodes,
            edges:        tpl.edges,
            workflowName: tpl.name,
            selectedNodeId: null,
          })
          setTimeout(() => get().rfInstance?.fitView({ padding: 0.15, duration: 400 }), 50)
        },

        setRfInstance: (inst: ReactFlowInstance) => {
          const [set] = a; set({ rfInstance: inst })
        },

        setWorkflowName: (name: string) => {
          const [set] = a; set({ workflowName: name })
        },

        setSavedWorkflowId: (id: string | null) => {
          const [set] = a; set({ savedWorkflowId: id })
        },

        saveWorkflowToBackend: async (): Promise<string> => {
          const [set, get] = a
          const { workflowName, nodes, edges, savedWorkflowId } = get()
          const payload = { name: workflowName, nodes, edges }
          const wf = savedWorkflowId
            ? await workflowService.save(savedWorkflowId, payload)
            : await workflowService.create(payload)
          set({ savedWorkflowId: wf.id })
          return wf.id
        },

        onNodesChange: (changes: NodeChange[]) => {
          const [set, get] = a
          const s = get()
          const newNodes = applyNodeChanges(changes, s.nodes) as CustomNode[]
          set({ nodes: newNodes })
          const significant = changes.some(c => {
            if (c.type === 'remove')   return true
            if (c.type === 'position') return !(c as NodePositionChange).dragging
            return false
          })
          if (significant) s.addToHistory({ nodes: newNodes, edges: s.edges })
        },

        onEdgesChange: (changes: EdgeChange[]) => {
          const [set, get] = a
          const s = get()
          const newEdges = applyEdgeChanges(changes, s.edges) as Edge[]
          set({ edges: newEdges })
          if (changes.some(c => c.type === 'remove')) s.addToHistory({ nodes: s.nodes, edges: newEdges })
        },

        onConnect: (connection: Connection) => {
          const [set, get] = a
          const s = get()
          const newEdges = addEdge({ ...connection, type: 'smoothstep', animated: false }, s.edges)
          set({ edges: newEdges })
          s.addToHistory({ nodes: s.nodes, edges: newEdges })
        },

        addNode: (type: string, position) => {
          const [set, get] = a
          const s = get()
          const id   = `${type}-${Date.now()}`
          const data: NodeData = { label: getNodeLabel(type), description: '', status: 'idle', config: {} }
          const newNode: CustomNode = { id, type, position, data }
          const newNodes = [...s.nodes, newNode]
          set({ nodes: newNodes })
          s.addToHistory({ nodes: newNodes, edges: s.edges })
        },

        deleteNode: (id: string) => {
          const [set, get] = a
          const s = get()
          const newNodes = s.nodes.filter(n => n.id !== id)
          const newEdges = s.edges.filter(e => e.source !== id && e.target !== id)
          set({ nodes: newNodes, edges: newEdges, selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId })
          s.addToHistory({ nodes: newNodes, edges: newEdges })
        },

        updateNode: (id: string, updates: Partial<CustomNode>) => {
          const [set, get] = a
          const s = get()
          const newNodes = s.nodes.map(n =>
            n.id === id ? { ...n, ...updates, data: { ...n.data, ...(updates.data ?? {}) } } : n,
          )
          set({ nodes: newNodes })
          s.addToHistory({ nodes: newNodes, edges: s.edges })
        },

        setSelectedNode: (id: string | null) => { const [set] = a; set({ selectedNodeId: id }) },

        resetFlow: () => {
          const [set, get] = a
          const s = get()
          s.addToHistory({ nodes: s.nodes, edges: s.edges })
          set({ nodes: initialNodes, edges: initialEdges, selectedNodeId: null })
        },

        autoLayout: (direction?: LayoutDirection) => {
          const [set, get] = a
          const s = get()
          const newNodes = computeAutoLayout(s.nodes, s.edges, direction ?? 'LR')
          set({ nodes: newNodes })
          s.addToHistory({ nodes: newNodes, edges: s.edges })
          setTimeout(() => s.rfInstance?.fitView({ padding: 0.15, duration: 400 }), 50)
        },

        exportWorkflow: () => {
          const [, get] = a
          const { nodes, edges, workflowName } = get()
          return JSON.stringify({ version: '2.0', workflowName, nodes, edges }, null, 2)
        },

        importWorkflow: (json: string) => {
          const [set, get] = a
          const s = get()
          const data = JSON.parse(json) as { nodes: CustomNode[]; edges: Edge[]; workflowName?: string }
          set({ nodes: data.nodes, edges: data.edges, workflowName: data.workflowName ?? 'Imported Workflow' })
          s.addToHistory({ nodes: data.nodes, edges: data.edges })
        },
      }),
      {
        name: storageKey(),
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          workflowName:    state.workflowName,
          savedWorkflowId: state.savedWorkflowId,
          nodes:           state.nodes,
          edges:           state.edges,
          templates:       state.templates,
          versions:        state.versions,
          runHistory:      state.runHistory,
        }),
        // After hydration, seed default templates if none exist yet
        onRehydrateStorage: () => (state) => {
          if (!state) return
          const hasDefaults = Object.keys(state.templates ?? {}).some(k => k.endsWith('-default'))
          if (!hasDefaults) {
            const defaults = buildDefaultTemplates()
            state.templates = { ...defaults, ...(state.templates ?? {}) }
          }
        },
      },
    ),
  )
}

export const useFlowStore = createStore()
