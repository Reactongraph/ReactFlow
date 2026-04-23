import { StateCreator } from 'zustand'
import { FlowState, ExecutionState, ExecutionLogEntry, NodeExecutionResult, LocalRun } from '../../types'
import {
  buildExecutionOrder,
  getIncomingEdgeIds,
  simulateNodeExecution,
  createLogEntry,
} from '../../engine/executor'

// Module-level abort controller — survives slice lifetime
let abortCtrl: AbortController | null = null

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const initialExecution: ExecutionState = {
  status: 'idle',
  currentNodeId: null,
  completedNodes: new Set(),
  failedNodes: new Set(),
  logs: [],
  results: {},
  startedAt: null,
  completedAt: null,
  activeEdges: new Set(),
  breakpoints: new Set(),
  isStepMode: false,
}

type ExecSliceKeys =
  | 'execution'
  | 'startExecution'
  | 'pauseExecution'
  | 'resumeExecution'
  | 'stopExecution'
  | 'stepExecution'
  | 'toggleBreakpoint'
  | 'clearExecutionLogs'
  | 'runHistory'
  | 'clearRunHistory'

export const createExecutionSlice: StateCreator<FlowState, [], [], Pick<FlowState, ExecSliceKeys>> = (set, get) => ({
  execution: initialExecution,
  runHistory: [],

  clearRunHistory: () => set({ runHistory: [] }),

  startExecution: async () => {
    abortCtrl?.abort()
    abortCtrl = new AbortController()
    const signal = abortCtrl.signal

    const { nodes, edges, execution: prevExec } = get()

    // Reset execution state, preserve breakpoints + stepMode
    set({
      execution: {
        ...initialExecution,
        status: 'running',
        startedAt: Date.now(),
        breakpoints: prevExec.breakpoints,
        isStepMode: prevExec.isStepMode,
      },
    })

    // Reset all node statuses to idle
    set(s => ({
      nodes: s.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' as const } })),
    }))

    if (nodes.length === 0) {
      set(s => ({ execution: { ...s.execution, status: 'completed', completedAt: Date.now() } }))
      return
    }

    const order = buildExecutionOrder(nodes, edges)

    const addLog = (entry: ExecutionLogEntry) =>
      set(s => ({ execution: { ...s.execution, logs: [...s.execution.logs, entry] } }))

    addLog(createLogEntry('__system__', 'Executor', 'info', `Workflow started — ${order.length} node${order.length !== 1 ? 's' : ''} queued`))

    for (const nodeId of order) {
      if (signal.aborted) return

      const node = get().nodes.find(n => n.id === nodeId)
      if (!node) continue

      // ── Breakpoint: auto-pause before this node ────────────
      if (get().execution.breakpoints.has(nodeId) && get().execution.status === 'running') {
        set(s => ({ execution: { ...s.execution, status: 'paused', currentNodeId: nodeId } }))
        addLog(createLogEntry(nodeId, node.data.label, 'warning', `⏸ Breakpoint — "${node.data.label}" paused`))
      }

      // ── Wait while paused ──────────────────────────────────
      while (get().execution.status === 'paused') {
        await sleep(60)
        if (signal.aborted) return
      }
      if (signal.aborted) return

      // ── Highlight incoming edges ───────────────────────────
      const inEdgeIds = getIncomingEdgeIds(nodeId, get().edges)
      set(s => ({
        execution: { ...s.execution, currentNodeId: nodeId, activeEdges: new Set(inEdgeIds) },
        nodes: s.nodes.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' as const } } : n,
        ),
      }))

      addLog(createLogEntry(nodeId, node.data.label, 'info', `→ Executing "${node.data.label}"`))

      const startedAt = Date.now()

      try {
        const { output, duration } = await simulateNodeExecution(
            node.type as string,
            (node.data.config ?? {}) as Record<string, unknown>,
            get().execution.results[order[order.indexOf(nodeId) - 1]]?.output ?? null,
            signal,
            nodeId,
            node.data.label,
          )
        if (signal.aborted) return

        const result: NodeExecutionResult = { nodeId, status: 'success', output, duration, startedAt }

        set(s => ({
          nodes: s.nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'success' as const } } : n,
          ),
          execution: {
            ...s.execution,
            completedNodes: new Set([...s.execution.completedNodes, nodeId]),
            results: { ...s.execution.results, [nodeId]: result },
            activeEdges: new Set(),
          },
        }))

        addLog(
          createLogEntry(nodeId, node.data.label, 'success',
            `✓ "${node.data.label}" completed in ${Math.round(duration)}ms`,
            output, duration,
          ),
        )
      } catch (err) {
        const duration = Date.now() - startedAt
        const result: NodeExecutionResult = {
          nodeId, status: 'error',
          error: String(err), duration, startedAt,
        }

        set(s => ({
          nodes: s.nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' as const } } : n,
          ),
          execution: {
            ...s.execution,
            failedNodes: new Set([...s.execution.failedNodes, nodeId]),
            results: { ...s.execution.results, [nodeId]: result },
            activeEdges: new Set(),
          },
        }))

        addLog(createLogEntry(nodeId, node.data.label, 'error', `✗ "${node.data.label}" failed — ${String(err)}`))
      }

      // ── Step mode: re-pause after each node ───────────────
      if (get().execution.isStepMode && get().execution.status === 'running') {
        set(s => ({ execution: { ...s.execution, status: 'paused', currentNodeId: null } }))
      }

      // Brief visual gap between nodes
      await sleep(120)
    }

    if (signal.aborted) return

    const { failedNodes } = get().execution
    const finalStatus = failedNodes.size > 0 ? 'failed' : 'completed'
    set(s => ({
      execution: {
        ...s.execution,
        status: finalStatus,
        currentNodeId: null,
        completedAt: Date.now(),
        activeEdges: new Set(),
        isStepMode: false,
      },
    }))

    const elapsed = Math.round((Date.now() - (get().execution.startedAt ?? Date.now())))

    // ── Record completed run in local history ──────────────
    const execSnap = get().execution
    const localRun: LocalRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workflowName: get().workflowName,
      status: failedNodes.size > 0 ? 'failed' : 'completed',
      startedAt: execSnap.startedAt ?? Date.now(),
      completedAt: Date.now(),
      durationMs: elapsed,
      nodeCount: order.length,
      completedNodes: execSnap.completedNodes.size,
      failedNodes: execSnap.failedNodes.size,
      logs: execSnap.logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        nodeId: l.nodeId,
        nodeLabel: l.nodeLabel,
        type: l.type,
        message: l.message,
        duration: l.duration,
      })),
      nodeResults: Object.fromEntries(
        Object.entries(execSnap.results).map(([id, r]) => [
          id,
          { status: r.status, duration: r.duration, error: r.error },
        ])
      ),
    }
    set(s => ({ runHistory: [localRun, ...s.runHistory].slice(0, 100) }))

    addLog(
      createLogEntry('__system__', 'Executor',
        failedNodes.size > 0 ? 'error' : 'success',
        failedNodes.size > 0
          ? `Execution failed — ${failedNodes.size} error${failedNodes.size > 1 ? 's' : ''}`
          : `Workflow completed successfully in ${elapsed}ms`,
      ),
    )
  },

  pauseExecution: () => {
    set(s => ({ execution: { ...s.execution, status: 'paused' } }))
  },

  resumeExecution: () => {
    set(s => ({ execution: { ...s.execution, status: 'running', isStepMode: false } }))
  },

  stopExecution: () => {
    abortCtrl?.abort()
    set(s => ({
      nodes: s.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' as const } })),
      execution: {
        ...initialExecution,
        breakpoints: s.execution.breakpoints, // preserve breakpoints on stop
      },
    }))
  },

  stepExecution: () => {
    const { status, isStepMode } = get().execution
    if (status === 'paused' || (status === 'running' && isStepMode)) {
      // Advance one node
      set(s => ({ execution: { ...s.execution, status: 'running', isStepMode: true } }))
    } else if (status === 'idle') {
      set(s => ({ execution: { ...s.execution, isStepMode: true } }))
      get().startExecution()
    }
  },

  toggleBreakpoint: (nodeId: string) => {
    set(s => {
      const bp = new Set(s.execution.breakpoints)
      if (bp.has(nodeId)) bp.delete(nodeId)
      else bp.add(nodeId)
      return { execution: { ...s.execution, breakpoints: bp } }
    })
  },

  clearExecutionLogs: () => {
    set(s => ({ execution: { ...s.execution, logs: [] } }))
  },
})
