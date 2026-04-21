import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, Play, Pause, Square, SkipForward,
  Undo2, Redo2, Download, Upload, CheckCircle2, RotateCcw,
  ArrowDownToLine, ArrowUpFromLine, Globe, Shuffle,
  Cpu, GitFork, Sparkles, Maximize2, Save, History,
  AlignStartVertical, AlignStartHorizontal,
} from 'lucide-react'
import { useFlowStore } from '../store'
import { NodeType } from '../types'

interface Command {
  id: string
  label: string
  description?: string
  group: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  disabled?: boolean
}

interface CommandPaletteProps {
  onClose: () => void
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const {
    undo, redo, history,
    validateWorkflow, exportWorkflow, importWorkflow,
    autoLayout, resetFlow,
    addNode, rfInstance,
    execution,
    startExecution, pauseExecution, resumeExecution, stopExecution, stepExecution,
    saveVersion,
    nodes,
  } = useFlowStore()

  const importRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'workflow.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const addNodeAtCenter = (type: NodeType) => {
    const vp    = rfInstance?.getViewport()
    const x     = vp ? (-vp.x + window.innerWidth  / 2) / vp.zoom : 300
    const y     = vp ? (-vp.y + window.innerHeight / 2) / vp.zoom : 200
    addNode(type, { x, y })
  }

  const isRunning = execution.status === 'running'
  const isPaused  = execution.status === 'paused'
  const isIdle    = execution.status === 'idle' || execution.status === 'completed' || execution.status === 'failed'

  const allCommands: Command[] = useMemo(() => [
    // ── Execution ───────────────────────────────────────────
    {
      id: 'run', label: 'Run Workflow', description: 'Start executing all nodes',
      group: 'Execution', icon: <Play size={14} />, shortcut: 'F5',
      action: () => startExecution(), disabled: isRunning || isPaused || nodes.length === 0,
    },
    {
      id: 'pause', label: 'Pause Execution', description: 'Pause at current node',
      group: 'Execution', icon: <Pause size={14} />,
      action: pauseExecution, disabled: !isRunning,
    },
    {
      id: 'resume', label: 'Resume Execution', description: 'Continue from paused state',
      group: 'Execution', icon: <Play size={14} />,
      action: resumeExecution, disabled: !isPaused,
    },
    {
      id: 'stop', label: 'Stop Execution', description: 'Stop and reset all nodes',
      group: 'Execution', icon: <Square size={14} />,
      action: stopExecution, disabled: isIdle,
    },
    {
      id: 'step', label: 'Step Through', description: 'Execute one node at a time',
      group: 'Execution', icon: <SkipForward size={14} />,
      action: stepExecution, disabled: isRunning && !isPaused,
    },

    // ── Edit ────────────────────────────────────────────────
    {
      id: 'undo', label: 'Undo', group: 'Edit',
      icon: <Undo2 size={14} />, shortcut: 'Ctrl+Z',
      action: undo, disabled: history.past.length === 0,
    },
    {
      id: 'redo', label: 'Redo', group: 'Edit',
      icon: <Redo2 size={14} />, shortcut: 'Ctrl+Y',
      action: redo, disabled: history.future.length === 0,
    },
    {
      id: 'validate', label: 'Validate Workflow', description: 'Check for errors',
      group: 'Edit', icon: <CheckCircle2 size={14} />, shortcut: 'Enter',
      action: () => validateWorkflow(),
    },
    {
      id: 'reset', label: 'Reset Canvas', description: 'Remove all nodes and edges',
      group: 'Edit', icon: <RotateCcw size={14} />,
      action: resetFlow, disabled: nodes.length === 0,
    },

    // ── Layout ──────────────────────────────────────────────
    {
      id: 'layout-lr', label: 'Auto Layout — Left → Right',
      group: 'Layout', icon: <AlignStartHorizontal size={14} />, shortcut: 'Ctrl+L',
      action: () => autoLayout('LR'), disabled: nodes.length === 0,
    },
    {
      id: 'layout-tb', label: 'Auto Layout — Top → Bottom',
      group: 'Layout', icon: <AlignStartVertical size={14} />,
      action: () => autoLayout('TB'), disabled: nodes.length === 0,
    },
    {
      id: 'fitview', label: 'Fit View', description: 'Zoom to fit all nodes',
      group: 'Layout', icon: <Maximize2 size={14} />,
      action: () => rfInstance?.fitView({ padding: 0.15, duration: 400 }),
    },

    // ── File ────────────────────────────────────────────────
    {
      id: 'export', label: 'Export Workflow', description: 'Download as JSON',
      group: 'File', icon: <Download size={14} />,
      action: handleExport,
    },
    {
      id: 'import', label: 'Import Workflow', description: 'Load from JSON file',
      group: 'File', icon: <Upload size={14} />,
      action: () => importRef.current?.click(),
    },
    {
      id: 'save-version', label: 'Save Version', description: 'Snapshot current workflow',
      group: 'File', icon: <Save size={14} />,
      action: () => saveVersion(),
    },
    {
      id: 'history', label: 'View Version History',
      group: 'File', icon: <History size={14} />,
      action: () => {/* toggled via TopBar — close palette */},
    },

    // ── Add Nodes ───────────────────────────────────────────
    {
      id: 'add-input', label: 'Add Input Node',
      group: 'Nodes', icon: <ArrowDownToLine size={14} className="text-blue-500" />,
      action: () => addNodeAtCenter('input'),
    },
    {
      id: 'add-output', label: 'Add Output Node',
      group: 'Nodes', icon: <ArrowUpFromLine size={14} className="text-emerald-500" />,
      action: () => addNodeAtCenter('output'),
    },
    {
      id: 'add-api', label: 'Add API Call Node',
      group: 'Nodes', icon: <Globe size={14} className="text-amber-500" />,
      action: () => addNodeAtCenter('api'),
    },
    {
      id: 'add-transform', label: 'Add Transform Node',
      group: 'Nodes', icon: <Shuffle size={14} className="text-cyan-500" />,
      action: () => addNodeAtCenter('transform'),
    },
    {
      id: 'add-decision', label: 'Add Decision Node',
      group: 'Nodes', icon: <GitFork size={14} className="text-pink-500" />,
      action: () => addNodeAtCenter('decision'),
    },
    {
      id: 'add-ai', label: 'Add AI Node',
      group: 'Nodes', icon: <Sparkles size={14} className="text-purple-600" />,
      action: () => addNodeAtCenter('ai'),
    },
    {
      id: 'add-processing', label: 'Add Processing Node',
      group: 'Nodes', icon: <Cpu size={14} className="text-violet-500" />,
      action: () => addNodeAtCenter('processing'),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isRunning, isPaused, isIdle, history.past.length, history.future.length, nodes.length])

  // ── Filter commands ──────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands.filter(c => !c.disabled)
    const q = query.toLowerCase()
    return allCommands.filter(c =>
      !c.disabled && (
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
      ),
    )
  }, [allCommands, query])

  // ── Group filtered results ───────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const cmd of filtered) {
      const g = map.get(cmd.group) ?? []
      g.push(cmd)
      map.set(cmd.group, g)
    }
    return map
  }, [filtered])

  // Flat list for keyboard navigation
  const flatFiltered = useMemo(() => {
    const out: Command[] = []
    for (const cmds of grouped.values()) out.push(...cmds)
    return out
  }, [grouped])

  // ── Keyboard navigation ──────────────────────────────────
  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, flatFiltered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = flatFiltered[selectedIdx]
        if (cmd) { cmd.action(); onClose() }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [flatFiltered, selectedIdx, onClose])

  // Import handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try { importWorkflow(ev.target?.result as string) }
      catch { /* invalid JSON */ }
    }
    reader.readAsText(file)
    e.target.value = ''
    onClose()
  }

  let flatIdx = 0

  return (
    <>
      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[16vh] bg-black/40 backdrop-blur-[3px] animate-fade-in"
        onMouseDown={onClose}
      >
        {/* Panel */}
        <div
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 animate-slide-up overflow-hidden"
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search commands, nodes, actions…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            <kbd className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
            {grouped.size === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                No results for &quot;{query}&quot;
              </p>
            ) : (
              Array.from(grouped.entries()).map(([group, cmds]) => (
                <div key={group}>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {group}
                  </p>
                  {cmds.map(cmd => {
                    const idx = flatIdx++
                    const isActive = idx === selectedIdx
                    return (
                      <button
                        key={cmd.id}
                        data-idx={idx}
                        onClick={() => { cmd.action(); onClose() }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={[
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive ? 'bg-indigo-50' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span className={isActive ? 'text-indigo-500' : 'text-slate-400'}>
                          {cmd.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className={`block text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {cmd.label}
                          </span>
                          {cmd.description && (
                            <span className="block text-[11px] text-slate-400 leading-tight">{cmd.description}</span>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2">
            <span className="text-[10px] text-slate-400">
              <kbd className="rounded bg-slate-100 px-1 py-0.5 font-medium">↑↓</kbd> navigate
            </span>
            <span className="text-[10px] text-slate-400">
              <kbd className="rounded bg-slate-100 px-1 py-0.5 font-medium">↵</kbd> select
            </span>
            <span className="text-[10px] text-slate-400">
              <kbd className="rounded bg-slate-100 px-1 py-0.5 font-medium">Ctrl K</kbd> toggle
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default CommandPalette
