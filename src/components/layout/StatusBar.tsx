import React from 'react'
import { CheckCircle2, AlertTriangle, Keyboard, Play, Pause, Square } from 'lucide-react'
import { useFlowStore } from '../../store'

const EXEC_BADGE: Record<string, { label: string; cls: string }> = {
  idle:      { label: 'Idle',      cls: 'text-slate-500' },
  running:   { label: 'Running',   cls: 'text-emerald-400' },
  paused:    { label: 'Paused',    cls: 'text-amber-400' },
  stopped:   { label: 'Stopped',   cls: 'text-slate-500' },
  completed: { label: 'Completed', cls: 'text-emerald-400' },
  failed:    { label: 'Failed',    cls: 'text-red-400' },
}

const EXEC_ICON: Record<string, React.ReactNode> = {
  running:   <Play  size={9} className="fill-emerald-400 text-emerald-400" />,
  paused:    <Pause size={9} className="text-amber-400" />,
  stopped:   <Square size={9} className="text-slate-500" />,
  completed: <CheckCircle2 size={9} className="text-emerald-400" />,
  failed:    <AlertTriangle size={9} className="text-red-400" />,
}

const StatusBar: React.FC = () => {
  const { nodes, edges, selectedNodeId, validation, history, execution } = useFlowStore()

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const errorCount   = validation.errors.length
  const isValid      = errorCount === 0
  const execBadge    = EXEC_BADGE[execution.status] ?? EXEC_BADGE.idle

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-slate-700 bg-slate-800 px-4 text-xs text-slate-400 select-none">
      {/* Counts */}
      <span className="flex items-center gap-1">
        <span className="font-medium text-slate-300">{nodes.length}</span> nodes
      </span>
      <span className="flex items-center gap-1">
        <span className="font-medium text-slate-300">{edges.length}</span> edges
      </span>

      {/* Selected node */}
      {selectedNode && (
        <>
          <span className="h-3 w-px bg-slate-600" />
          <span className="flex items-center gap-1">
            Selected:&nbsp;
            <span className="font-medium text-slate-200">{selectedNode.data.label}</span>
            <span className="text-slate-500">({selectedNode.type})</span>
          </span>
        </>
      )}

      {/* History */}
      <span className="h-3 w-px bg-slate-600" />
      <span>{history.past.length} history steps</span>

      {/* Execution status */}
      <span className="h-3 w-px bg-slate-600" />
      <span className={`flex items-center gap-1 ${execBadge.cls}`}>
        {EXEC_ICON[execution.status]}
        {execBadge.label}
        {execution.status === 'running' && execution.currentNodeId && (
          <span className="text-slate-500 ml-0.5">
            — {nodes.find(n => n.id === execution.currentNodeId)?.data.label ?? ''}
          </span>
        )}
      </span>

      <span className="flex-1" />

      {/* Breakpoints */}
      {execution.breakpoints.size > 0 && (
        <>
          <span className="flex items-center gap-1 text-red-400">
            ● {execution.breakpoints.size} breakpoint{execution.breakpoints.size !== 1 ? 's' : ''}
          </span>
          <span className="h-3 w-px bg-slate-600" />
        </>
      )}

      {/* Validation */}
      {isValid ? (
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 size={11} /> Valid
        </span>
      ) : (
        <span className="flex items-center gap-1 text-amber-400">
          <AlertTriangle size={11} /> {errorCount} issue{errorCount !== 1 ? 's' : ''}
        </span>
      )}

      <span className="h-3 w-px bg-slate-600" />

      {/* Ctrl+K hint */}
      <span className="flex items-center gap-1 text-slate-500">
        <Keyboard size={11} />
        Ctrl+K for commands
      </span>
    </footer>
  )
}

export default StatusBar
