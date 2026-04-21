import React, { useEffect, useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, CheckCircle2, XCircle,
  AlertTriangle, Info, Trash2, Clock, Database,
} from 'lucide-react'
import { useFlowStore } from '../../store'
import { ExecutionLogEntry, NodeExecutionResult } from '../../types'
import { Button } from '../ui/Button'

// ── Log entry row ──────────────────────────────────────────────

const LOG_ICON: Record<ExecutionLogEntry['type'], React.ReactNode> = {
  info:    <Info      size={11} className="text-slate-400 shrink-0 mt-0.5" />,
  success: <CheckCircle2 size={11} className="text-emerald-500 shrink-0 mt-0.5" />,
  error:   <XCircle   size={11} className="text-red-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />,
}

const LOG_TEXT: Record<ExecutionLogEntry['type'], string> = {
  info:    'text-slate-600',
  success: 'text-emerald-700',
  error:   'text-red-700',
  warning: 'text-amber-700',
}

const LogRow: React.FC<{ entry: ExecutionLogEntry }> = ({ entry }) => {
  const time = new Date(entry.timestamp).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
      {LOG_ICON[entry.type]}
      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums pt-0.5">{time}</span>
      <span className={`flex-1 text-xs leading-relaxed ${LOG_TEXT[entry.type]}`}>{entry.message}</span>
      {entry.duration !== undefined && (
        <span className="text-[10px] text-slate-400 shrink-0 tabular-nums pt-0.5">
          {Math.round(entry.duration)}ms
        </span>
      )}
    </div>
  )
}

// ── Node result card ──────────────────────────────────────────

const ResultCard: React.FC<{ result: NodeExecutionResult; label: string }> = ({ result, label }) => {
  const [expanded, setExpanded] = useState(false)

  const statusColor = result.status === 'success'
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : result.status === 'error'
    ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-slate-500 bg-slate-50 border-slate-200'

  return (
    <div className="mx-3 mb-2 rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(o => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
      >
        {expanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
        <span className="flex-1 text-xs font-medium text-slate-700 truncate">{label}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusColor}`}>
          {result.status}
        </span>
        <span className="text-[10px] text-slate-400 tabular-nums flex items-center gap-1">
          <Clock size={9} />
          {Math.round(result.duration)}ms
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          {result.error ? (
            <p className="text-xs text-red-600 font-mono">{result.error}</p>
          ) : result.output ? (
            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Database size={9} /> Output
              </p>
              <pre className="max-h-32 overflow-auto rounded bg-slate-50 p-2 text-[10px] font-mono text-slate-700 leading-relaxed">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No output data</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────

const STATUS_STYLES = {
  idle:      { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Idle' },
  running:   { dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600', label: 'Running' },
  paused:    { dot: 'bg-amber-500', text: 'text-amber-600', label: 'Paused' },
  stopped:   { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Stopped' },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Completed' },
  failed:    { dot: 'bg-red-500', text: 'text-red-600', label: 'Failed' },
}

// ── Main panel ────────────────────────────────────────────────

type Tab = 'logs' | 'results'

const ExecutionPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [tab,  setTab]  = useState<Tab>('logs')
  const logsEndRef = useRef<HTMLDivElement>(null)

  const { execution, nodes, clearExecutionLogs } = useFlowStore()
  const { status, logs, results } = execution

  const style = STATUS_STYLES[status]
  const resultEntries = Object.values(results)
  const elapsed = execution.startedAt && execution.completedAt
    ? Math.round(execution.completedAt - execution.startedAt)
    : null

  // Auto-open when execution starts; auto-scroll logs
  useEffect(() => {
    if (status === 'running') setOpen(true)
  }, [status])

  useEffect(() => {
    if (open && tab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, open, tab])

  return (
    <div
      className={[
        'flex shrink-0 flex-col border-t border-slate-200 bg-white transition-all duration-300',
        open ? 'h-52' : 'h-8',
      ].join(' ')}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-slate-100 px-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
        >
          {open
            ? <ChevronDown size={11} className="text-slate-400" />
            : <ChevronRight size={11} className="text-slate-400" />
          }
          <span className="uppercase tracking-wider">Execution</span>
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          <span className={`text-[11px] font-medium ${style.text}`}>{style.label}</span>
          {elapsed !== null && (
            <span className="text-[10px] text-slate-400">({elapsed}ms total)</span>
          )}
        </div>

        {/* Tabs */}
        {open && (
          <div className="ml-3 flex gap-0.5">
            {(['logs', 'results'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-2 py-0.5 text-[11px] font-medium rounded transition-colors capitalize',
                  tab === t
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {t}
                {t === 'logs' && logs.length > 0 && (
                  <span className="ml-1 text-[9px] text-slate-400">({logs.length})</span>
                )}
                {t === 'results' && resultEntries.length > 0 && (
                  <span className="ml-1 text-[9px] text-slate-400">({resultEntries.length})</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        {open && tab === 'logs' && logs.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearExecutionLogs} className="!h-5 !w-5">
            <Trash2 size={10} />
          </Button>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {open && (
        <div className="flex-1 overflow-y-auto">
          {tab === 'logs' ? (
            logs.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-slate-400">Run the workflow to see execution logs</p>
              </div>
            ) : (
              <div>
                {logs.map(entry => <LogRow key={entry.id} entry={entry} />)}
                <div ref={logsEndRef} />
              </div>
            )
          ) : (
            resultEntries.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-slate-400">No execution results yet</p>
              </div>
            ) : (
              <div className="py-2">
                {resultEntries.map(result => {
                  const node = nodes.find(n => n.id === result.nodeId)
                  return (
                    <ResultCard
                      key={result.nodeId}
                      result={result}
                      label={node?.data.label ?? result.nodeId}
                    />
                  )
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default ExecutionPanel
