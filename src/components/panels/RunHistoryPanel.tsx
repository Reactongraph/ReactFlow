import React, { useState, useEffect, useCallback } from 'react'
import {
  History, X, RefreshCw, CheckCircle2, XCircle,
  Clock, Loader2, ChevronDown, ChevronRight,
  AlertCircle, Play, Square,
} from 'lucide-react'
import { workflowService, ApiWorkflowRun, ApiExecutionLog } from '../../services/workflow.service'

interface Props {
  workflowId: string
  onClose: () => void
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={13} className="text-emerald-500" />,
  failed:    <XCircle     size={13} className="text-red-500" />,
  running:   <Loader2     size={13} className="animate-spin text-indigo-500" />,
  pending:   <Clock       size={13} className="text-slate-400" />,
  cancelled: <Square      size={13} className="text-slate-400" />,
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  failed:    'bg-red-100 text-red-700',
  running:   'bg-indigo-100 text-indigo-700',
  pending:   'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-500',
}

const LOG_LEVEL_CLASS: Record<string, string> = {
  success: 'text-emerald-600',
  error:   'text-red-600',
  warning: 'text-amber-600',
  info:    'text-slate-500',
  debug:   'text-slate-400',
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatRelative(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const LogRow: React.FC<{ log: ApiExecutionLog }> = ({ log }) => (
  <div className="flex items-start gap-2 py-1 font-mono text-[10px]">
    <span className="shrink-0 text-slate-400 tabular-nums w-20">
      {new Date(log.createdAt).toLocaleTimeString()}
    </span>
    <span className={`shrink-0 w-12 font-semibold ${LOG_LEVEL_CLASS[log.level] ?? 'text-slate-500'}`}>
      {log.level.toUpperCase()}
    </span>
    {log.nodeLabel && (
      <span className="shrink-0 rounded bg-slate-100 px-1 text-slate-500 max-w-[100px] truncate">
        {log.nodeLabel}
      </span>
    )}
    <span className="text-slate-700 break-all">{log.message}</span>
    {log.durationMs != null && (
      <span className="ml-auto shrink-0 text-slate-400">{log.durationMs}ms</span>
    )}
  </div>
)

const RunRow: React.FC<{
  run: ApiWorkflowRun
  workflowId: string
  expanded: boolean
  onToggle: () => void
}> = ({ run, workflowId, expanded, onToggle }) => {
  const [logs, setLogs]       = useState<ApiExecutionLog[]>([])
  const [logsLoading, setLL]  = useState(false)

  useEffect(() => {
    if (!expanded || logs.length > 0) return
    setLL(true)
    workflowService.getLogs(workflowId, run.id)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLL(false))
  }, [expanded, run.id, workflowId, logs.length])

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="shrink-0">{STATUS_ICON[run.status] ?? <AlertCircle size={13} />}</span>

        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-slate-800 truncate">
            Run {run.id.slice(0, 8)}
          </span>
          <span className="text-xs text-slate-400">
            {formatRelative(run.createdAt)} · {run.triggerType}
          </span>
        </span>

        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[run.status] ?? ''}`}>
          {run.status}
        </span>

        <span className="shrink-0 text-xs text-slate-400 w-14 text-right">
          {formatDuration(run.durationMs)}
        </span>

        <span className="shrink-0 text-slate-300">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {run.errorMessage && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <XCircle size={12} className="mt-0.5 shrink-0" />
              {run.errorMessage}
            </div>
          )}

          {logsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Loading logs…
            </div>
          ) : logs.length > 0 ? (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {logs.map(log => <LogRow key={log.id} log={log} />)}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No logs available.</p>
          )}
        </div>
      )}
    </div>
  )
}

const RunHistoryPanel: React.FC<Props> = ({ workflowId, onClose }) => {
  const [runs,      setRuns]     = useState<ApiWorkflowRun[]>([])
  const [total,     setTotal]    = useState(0)
  const [loading,   setLoading]  = useState(false)
  const [expanded,  setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workflowId) return
    setLoading(true)
    try {
      const res = await workflowService.listRuns(workflowId)
      setRuns(res.data)
      setTotal(res.total)
    } catch { /* no-op — user may not be logged in */ }
    finally { setLoading(false) }
  }, [workflowId])

  useEffect(() => { load() }, [load])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <History size={18} className="text-indigo-600" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-800">Run History</h2>
            <p className="text-xs text-slate-400">{total} total runs</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && runs.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Loading runs…
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Play size={28} className="text-slate-200" />
              <p className="text-sm text-slate-400">No runs yet — trigger this workflow to see history.</p>
            </div>
          ) : (
            runs.map(run => (
              <RunRow
                key={run.id}
                run={run}
                workflowId={workflowId}
                expanded={expanded === run.id}
                onToggle={() => setExpanded(v => v === run.id ? null : run.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default RunHistoryPanel
