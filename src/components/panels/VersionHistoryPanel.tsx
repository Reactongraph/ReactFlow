import React, { useState } from 'react'
import { History, RotateCcw, Trash2, X, GitBranch, Save } from 'lucide-react'
import { useFlowStore } from '../../store'
import { Button } from '../ui/Button'

interface VersionHistoryPanelProps {
  onClose: () => void
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ onClose }) => {
  const { versions, saveVersion, restoreVersion, deleteVersion, nodes, edges } = useFlowStore()
  const [versionName, setVersionName] = useState('')
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)

  const handleSave = () => {
    saveVersion(versionName.trim() || undefined)
    setVersionName('')
  }

  const handleRestore = (id: string) => {
    if (confirmRestore === id) {
      restoreVersion(id)
      setConfirmRestore(null)
      onClose()
    } else {
      setConfirmRestore(id)
    }
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  const formatAge = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60_000)  return 'just now'
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
    return `${Math.round(diff / 86_400_000)}d ago`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-fade-in"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-slide-up overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <History size={15} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Version History</p>
            <p className="text-xs text-slate-400">{versions.length} saved version{versions.length !== 1 ? 's' : ''} · max 20</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Save new version */}
        <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Save current state
          </p>
          <div className="flex gap-2">
            <input
              value={versionName}
              onChange={e => setVersionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder={`v${versions.length + 1} — auto-named if blank`}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300"
            />
            <Button variant="primary" size="sm" onClick={handleSave} disabled={nodes.length === 0}>
              <Save size={12} />
              Save
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}, {edges.length} edge{edges.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Version list */}
        <div className="max-h-72 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <GitBranch size={24} className="text-slate-300" />
              <p className="text-sm text-slate-400">No versions saved yet</p>
              <p className="text-xs text-slate-300">Save the current state to create a version</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {versions.map((v, i) => (
                <div key={v.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  {/* Timeline dot */}
                  <div className="mt-1 flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    {i < versions.length - 1 && <div className="mt-1 h-8 w-px bg-slate-200" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{v.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(v.createdAt)}
                      <span className="ml-1.5 text-slate-300">·</span>
                      <span className="ml-1.5">{formatAge(v.createdAt)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {v.nodes.length} node{v.nodes.length !== 1 ? 's' : ''} · {v.edges.length} edge{v.edges.length !== 1 ? 's' : ''}
                      {v.workflowName !== 'Untitled Workflow' && (
                        <> · <span className="italic">{v.workflowName}</span></>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRestore(v.id)}
                      className={[
                        'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                        confirmRestore === v.id
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'text-indigo-600 hover:bg-indigo-50',
                      ].join(' ')}
                    >
                      <RotateCcw size={10} />
                      {confirmRestore === v.id ? 'Confirm?' : 'Restore'}
                    </button>
                    <button
                      onClick={() => deleteVersion(v.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-[10px] text-slate-400 text-center">
            Restoring a version saves the current state to history (Ctrl+Z to undo)
          </p>
        </div>
      </div>
    </div>
  )
}

export default VersionHistoryPanel
