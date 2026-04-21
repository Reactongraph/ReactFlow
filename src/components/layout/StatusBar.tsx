import React from 'react'
import { CheckCircle2, AlertTriangle, Keyboard } from 'lucide-react'
import { useFlowStore } from '../../store'

const StatusBar: React.FC = () => {
  const { nodes, edges, selectedNodeId, validation, history } = useFlowStore()

  const selectedNode  = nodes.find(n => n.id === selectedNodeId)
  const errorCount    = validation.errors.length
  const isValid       = errorCount === 0

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

      <span className="flex-1" />

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

      {/* Shortcut hint */}
      <span className="flex items-center gap-1 text-slate-500">
        <Keyboard size={11} />
        Right-click canvas for menu
      </span>
    </footer>
  )
}

export default StatusBar
