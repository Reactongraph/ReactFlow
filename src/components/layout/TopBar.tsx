import React, { useRef, useState } from 'react'
import {
  Workflow, Undo2, Redo2, LayoutGrid, CheckCircle2,
  Download, Upload, RotateCcw, ChevronDown,
} from 'lucide-react'
import { useFlowStore } from '../../store'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import ConfirmDialog from '../ui/ConfirmDialog'

const TopBar: React.FC = () => {
  const {
    workflowName, setWorkflowName,
    undo, redo, history,
    autoLayout, validateWorkflow,
    exportWorkflow, importWorkflow,
    resetFlow, nodes, edges,
  } = useFlowStore()

  const [editingName,   setEditingName]   = useState(false)
  const [nameValue,     setNameValue]     = useState(workflowName)
  const [confirmReset,  setConfirmReset]  = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  /* ── Workflow name ─────────────────────────────────────── */
  const commitName = () => {
    setWorkflowName(nameValue.trim() || 'Untitled Workflow')
    setEditingName(false)
  }

  /* ── Export ────────────────────────────────────────────── */
  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${workflowName.replace(/\s+/g, '_')}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Import ────────────────────────────────────────────── */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { importWorkflow(ev.target?.result as string) }
      catch { /* invalid JSON — silently ignore */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  /* ── Validate ──────────────────────────────────────────── */
  const handleValidate = () => { validateWorkflow() }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-200 mr-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Workflow size={15} className="text-white" />
        </div>
        <span className="text-sm font-bold text-slate-800 hidden sm:block">FlowBuilder</span>
      </div>

      {/* Workflow name */}
      {editingName ? (
        <input
          autoFocus
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
          className="h-7 rounded-md border border-indigo-300 bg-white px-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 w-48"
        />
      ) : (
        <button
          onClick={() => { setNameValue(workflowName); setEditingName(true) }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {workflowName}
          <ChevronDown size={12} className="text-slate-400" />
        </button>
      )}

      <div className="mx-2 h-5 w-px bg-slate-200" />

      {/* Undo / Redo */}
      <Tooltip content="Undo (Ctrl+Z)" side="bottom">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
          <Undo2 size={15} />
        </Button>
      </Tooltip>
      <Tooltip content="Redo (Ctrl+Shift+Z)" side="bottom">
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
          <Redo2 size={15} />
        </Button>
      </Tooltip>

      <div className="mx-2 h-5 w-px bg-slate-200" />

      {/* Auto Layout */}
      <Tooltip content="Auto Layout" side="bottom">
        <Button variant="ghost" size="icon" onClick={autoLayout} disabled={nodes.length === 0}>
          <LayoutGrid size={15} />
        </Button>
      </Tooltip>

      {/* Reset */}
      <Tooltip content="Reset canvas" side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmReset(true)}
          disabled={nodes.length === 0 && edges.length === 0}
        >
          <RotateCcw size={15} />
        </Button>
      </Tooltip>

      <ConfirmDialog
        open={confirmReset}
        title="Reset canvas"
        description="This will remove all nodes and edges. This action cannot be undone."
        confirmLabel="Reset"
        onConfirm={() => { resetFlow(); setConfirmReset(false) }}
        onCancel={() => setConfirmReset(false)}
      />

      <div className="flex-1" />

      {/* Validate */}
      <Tooltip content="Validate workflow" side="bottom">
        <Button variant="outline" size="sm" onClick={handleValidate}>
          <CheckCircle2 size={13} />
          Validate
        </Button>
      </Tooltip>

      <div className="mx-2 h-5 w-px bg-slate-200" />

      {/* Import */}
      <Tooltip content="Import JSON" side="bottom">
        <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
          <Upload size={13} />
          Import
        </Button>
      </Tooltip>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Export */}
      <Tooltip content="Export JSON" side="bottom">
        <Button variant="primary" size="sm" onClick={handleExport}>
          <Download size={13} />
          Export
        </Button>
      </Tooltip>
    </header>
  )
}

export default TopBar
