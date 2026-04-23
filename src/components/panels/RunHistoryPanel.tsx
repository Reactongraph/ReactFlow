import React, { useState } from 'react'
import {
  History, X, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronRight, Play, Trash2,
} from 'lucide-react'
import { useFlowStore } from '../../store'
import type { LocalRun, LocalRunLog } from '../../types'

interface Props { onClose: () => void }

// ── Helpers ────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const LOG_COLOR: Record<string, string> = {
  success: 'text-emerald-600',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-slate-400',
}

// ── Log row ────────────────────────────────────────────────────

const LogRow: React.FC<{ log: LocalRunLog }> = ({ log }) => (
  <div className="flex items-start gap-2 py-0.5 font-mono text-[10px]">
    <span className="w-16 shrink-0 tabular-nums text-slate-400">
      {new Date(log.timestamp).toLocaleTimeString()}
    </span>
    <span className={`w-14 shrink-0 font-bold ${LOG_COLOR[log.type] ?? 'text-slate-400'}`}>
      {log.type.toUpperCase()}
    </span>
    {log.nodeLabel && log.nodeLabel !== 'Executor' && (
      <span className="max-w-[90px] shrink-0 truncate rounded bg-slate-100 px-1 text-slate-500">
        {log.nodeLabel}
      </span>
    )}
    <span className="flex-1 break-all text-slate-600">{log.message}</span>
    {log.duration != null && (
      <span className="ml-auto shrink-0 text-slate-400">{Math.round(log.duration)}ms</span>
    )}
  </div>
)

// ── Run row ────────────────────────────────────────────────────

const RunRow: React.FC<{ run: LocalRun; expanded: boolean; onToggle: () => void }> = ({
  run, expanded, onToggle,
}) => {
  const isOk = run.status === 'completed'

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        {/* Status icon */}
        <span className="shrink-0">
          {isOk
            ? <CheckCircle2 size={14} className="text-emerald-500" />
            : <XCircle      size={14} className="text-red-500" />}
        </span>

        {/* Name + time */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">
            {run.workflowName}
          </span>
          <span className="text-[11px] text-slate-400">
            {formatRelative(run.startedAt)} · {run.nodeCount} node{run.nodeCount !== 1 ? 's' : ''}
          </span>
        </span>

        {/* Status badge */}
        <span className={[
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          isOk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
        ].join(' ')}>
          {run.status}
        </span>

        {/* Duration */}
        <span className="w-12 shrink-0 text-right text-xs text-slate-400">
          {formatDuration(run.durationMs)}
        </span>

        {/* Chevron */}
        <span className="shrink-0 text-slate-300">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {/* Expanded log view */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {/* Node result summary */}
          <div className="mb-3 flex gap-4 text-[11px]">
            <span className="text-emerald-600 font-medium">
              ✓ {run.completedNodes} completed
            </span>
            {run.failedNodes > 0 && (
              <span className="text-red-500 font-medium">
                ✗ {run.failedNodes} failed
              </span>
            )}
            <span className="text-slate-400 ml-auto">
              <Clock size={10} className="inline mr-1" />
              {formatDuration(run.durationMs)} total
            </span>
          </div>

          {/* Logs */}
          {run.logs.length > 0 ? (
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-2 py-1">
              {run.logs.map(log => <LogRow key={log.id} log={log} />)}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No logs recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────

const RunHistoryPanel: React.FC<Props> = ({ onClose }) => {
  const runHistory    = useFlowStore(s => s.runHistory)
  const clearHistory  = useFlowStore(s => s.clearRunHistory)
  const [expanded, setExpanded] = useState<string | null>(null)

  const completed = runHistory.filter(r => r.status === 'completed').length
  const failed    = runHistory.filter(r => r.status === 'failed').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <History size={18} className="text-indigo-600" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-800">Run History</h2>
            <p className="text-xs text-slate-400">
              {runHistory.length} total
              {runHistory.length > 0 && (
                <> · <span className="text-emerald-600">{completed} ok</span>
                {failed > 0 && <> · <span className="text-red-500">{failed} failed</span></>}</>
              )}
            </p>
          </div>

          {runHistory.length > 0 && (
            <button
              onClick={clearHistory}
              title="Clear history"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {runHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Play size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No runs yet</p>
              <p className="text-xs text-slate-400">Run the workflow to see history here</p>
            </div>
          ) : (
            runHistory.map(run => (
              <RunRow
                key={run.id}
                run={run}
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
