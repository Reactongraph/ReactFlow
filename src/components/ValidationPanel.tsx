import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { useFlowStore } from '../store'
import { ValidationError } from '../types'

// ── Severity mapping ───────────────────────────────────────────
// workflow-level = warning (amber), node-level = error (red), edge = info

function getIcon(err: ValidationError) {
  if (err.type === 'workflow') return <AlertTriangle size={11} className="shrink-0 mt-0.5 text-amber-500" />
  if (err.type === 'edge')     return <Info          size={11} className="shrink-0 mt-0.5 text-blue-400" />
  return                              <XCircle       size={11} className="shrink-0 mt-0.5 text-red-400" />
}

function getBg(err: ValidationError) {
  if (err.type === 'workflow') return 'hover:bg-amber-50'
  if (err.type === 'edge')     return 'hover:bg-blue-50'
  return 'hover:bg-red-50'
}

const ValidationPanel: React.FC = () => {
  const { validation, setSelectedNode } = useFlowStore()
  const [open, setOpen] = useState(true)
  const errors = validation.errors

  const nodeErrors     = errors.filter(e => e.type === 'node')
  const workflowErrors = errors.filter(e => e.type === 'workflow')
  const edgeErrors     = errors.filter(e => e.type === 'edge')

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {errors.length === 0 ? (
          <>
            <CheckCircle2 size={11} className="text-emerald-500" />
            <span className="text-emerald-600">Valid</span>
          </>
        ) : (
          <>
            <AlertTriangle size={11} className="text-amber-500" />
            <span className="text-amber-600">
              {errors.length} issue{errors.length !== 1 ? 's' : ''}
            </span>
            {/* Breakdown badges */}
            <span className="ml-auto flex items-center gap-1">
              {workflowErrors.length > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                  {workflowErrors.length} workflow
                </span>
              )}
              {nodeErrors.length > 0 && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
                  {nodeErrors.length} node
                </span>
              )}
              {edgeErrors.length > 0 && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">
                  {edgeErrors.length} edge
                </span>
              )}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="max-h-48 overflow-y-auto">
          {errors.length === 0 ? (
            <p className="px-4 pb-3 text-xs text-slate-400">
              Workflow is valid and ready to run.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50 pb-1">
              {errors.map(err => (
                <li
                  key={err.id}
                  onClick={() => err.nodeId && setSelectedNode(err.nodeId)}
                  className={[
                    'flex items-start gap-2 px-4 py-2 text-[11px] text-slate-600 transition-colors',
                    err.nodeId ? `cursor-pointer ${getBg(err)}` : '',
                  ].join(' ')}
                >
                  {getIcon(err)}
                  <span className="leading-relaxed">{err.message}</span>
                  {err.nodeId && (
                    <span className="ml-auto shrink-0 text-[9px] text-slate-300">click to select</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default ValidationPanel
