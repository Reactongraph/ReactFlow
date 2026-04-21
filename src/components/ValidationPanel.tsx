import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useFlowStore } from '../store'
import { ValidationError } from '../types'

const iconByType: Record<ValidationError['type'], React.ReactNode> = {
  node:     <XCircle     size={12} className="text-red-400 shrink-0 mt-0.5" />,
  edge:     <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />,
  workflow: <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />,
}

const ValidationPanel: React.FC = () => {
  const { validation, setSelectedNode } = useFlowStore()
  const [open, setOpen] = useState(true)
  const errors = validation.errors

  return (
    <div className="border-t border-slate-200 bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {errors.length === 0 ? (
          <>
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-emerald-600">Valid</span>
          </>
        ) : (
          <>
            <AlertTriangle size={12} className="text-amber-500" />
            <span className="text-amber-600">{errors.length} issue{errors.length !== 1 ? 's' : ''}</span>
          </>
        )}
      </button>

      {open && (
        <div className="max-h-36 overflow-y-auto">
          {errors.length === 0 ? (
            <p className="px-4 pb-3 text-xs text-slate-400">Workflow is valid and ready to run.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {errors.map(err => (
                <li
                  key={err.id}
                  onClick={() => err.nodeId && setSelectedNode(err.nodeId)}
                  className={`flex items-start gap-2 px-4 py-2 text-xs text-slate-600 transition-colors ${err.nodeId ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  {iconByType[err.type]}
                  <span className="leading-relaxed">{err.message}</span>
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
