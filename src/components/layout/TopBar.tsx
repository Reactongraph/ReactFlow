import React, { useRef, useState } from 'react'
import {
  Workflow, Undo2, Redo2, LayoutGrid, CheckCircle2,
  Download, Upload, RotateCcw, ChevronDown,
  Play, Pause, Square, SkipForward, History, Save,
  AlignStartVertical, AlignStartHorizontal,
  Command, FileText, Loader2, LogOut, User,
  Key, Activity, Sparkles,
} from 'lucide-react'
import { useFlowStore } from '../../store'
import { useAuthStore } from '../../store/slices/auth'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import ConfirmDialog from '../ui/ConfirmDialog'
import VersionHistoryPanel from '../panels/VersionHistoryPanel'
import { CredentialManager } from '../panels/CredentialManager'
import { MonitoringDashboard } from '../panels/MonitoringDashboard'
import { AiWorkflowBuilder } from '../panels/AiWorkflowBuilder'
import type { GeneratedWorkflow } from '../../services/ai-builder.service'

interface TopBarProps {
  onOpenCommandPalette: () => void
  onShowRunHistory?: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette, onShowRunHistory }) => {
  const {
    workflowName, setWorkflowName,
    undo, redo, history,
    autoLayout, validateWorkflow,
    exportWorkflow, importWorkflow,
    resetFlow, nodes, edges,
    execution,
    startExecution, pauseExecution, resumeExecution, stopExecution, stepExecution,
    saveVersion,
    rfInstance,
  } = useFlowStore()

  const { user, logout } = useAuthStore()

  const [editingName,       setEditingName]       = useState(false)
  const [nameValue,         setNameValue]         = useState(workflowName)
  const [confirmReset,      setConfirmReset]      = useState(false)
  const [showVersions,      setShowVersions]      = useState(false)
  const [showLayoutMenu,    setShowLayoutMenu]    = useState(false)
  const [showExportMenu,    setShowExportMenu]    = useState(false)
  const [showUserMenu,      setShowUserMenu]      = useState(false)
  const [pdfExporting,      setPdfExporting]      = useState(false)
  const [showCredentials,   setShowCredentials]   = useState(false)
  const [showMonitoring,    setShowMonitoring]    = useState(false)
  const [showAiBuilder,     setShowAiBuilder]     = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const userInitials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : <User size={13} />

  const canUndo  = history.past.length   > 0
  const canRedo  = history.future.length > 0
  const isEmpty  = nodes.length === 0 && edges.length === 0

  const { status } = execution
  const isRunning  = status === 'running'
  const isPaused   = status === 'paused'
  const isActive   = isRunning || isPaused

  /* ── Workflow name ──────────────────────────────────────── */
  const commitName = () => {
    setWorkflowName(nameValue.trim() || 'Untitled Workflow')
    setEditingName(false)
  }

  /* ── Export ─────────────────────────────────────────────── */
  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `${workflowName.replace(/\s+/g, '_')}.json`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Export PDF ─────────────────────────────────────────── */
  const handleExportPdf = async () => {
    if (pdfExporting) return
    setPdfExporting(true)
    try {
      rfInstance?.fitView({ padding: 0.12, duration: 0 })
      await new Promise(r => setTimeout(r, 120))
      // Lazy-load so html2canvas + jsPDF split into a separate chunk
      const { exportWorkflowAsPdf } = await import('../../utils/exportPdf')
      await exportWorkflowAsPdf({
        workflowName,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      })
    } finally {
      setPdfExporting(false)
    }
  }

  /* ── Import ─────────────────────────────────────────────── */
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
  }

  /* ── AI workflow apply ──────────────────────────────────── */
  const handleApplyAiWorkflow = (wf: GeneratedWorkflow) => {
    // Map AI nodes into CustomNode shape the store expects
    const mappedNodes = wf.nodes.map(n => ({
      id:       n.id,
      type:     'customNode',
      position: n.position,
      data: {
        label:    n.label,
        nodeType: n.type,
        ...n.data,
        inputs:   [],
        outputs:  [],
        status:   'idle' as const,
      },
    }))
    importWorkflow(JSON.stringify({ nodes: mappedNodes, edges: wf.edges, workflowName: wf.name }))
    setShowAiBuilder(false)
  }

  /* ── Execution controls ─────────────────────────────────── */
  const handleRun = () => {
    if (isPaused) resumeExecution()
    else startExecution()
  }

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3">

        {/* ── Logo ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200 mr-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Workflow size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 hidden sm:block">FlowBuilder</span>
        </div>

        {/* ── Workflow name ──────────────────────────────────── */}
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitName()
              if (e.key === 'Escape') setEditingName(false)
            }}
            className="h-7 w-48 rounded-md border border-indigo-300 bg-white px-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400"
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

        {/* ── Command palette hint ───────────────────────────── */}
        <Tooltip content="Command Palette" side="bottom">
          <button
            onClick={onOpenCommandPalette}
            className="ml-1 flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <Command size={11} />
            <span className="hidden sm:inline">Ctrl K</span>
          </button>
        </Tooltip>

        <div className="mx-2 h-5 w-px bg-slate-200" />

        {/* ── Undo / Redo ────────────────────────────────────── */}
        <Tooltip content="Undo (Ctrl+Z)" side="bottom">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
            <Undo2 size={15} />
          </Button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Y)" side="bottom">
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
            <Redo2 size={15} />
          </Button>
        </Tooltip>

        <div className="mx-2 h-5 w-px bg-slate-200" />

        {/* ── Layout picker ─────────────────────────────────── */}
        <div className="relative">
          <Tooltip content="Auto Layout" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLayoutMenu(o => !o)}
              disabled={nodes.length === 0}
            >
              <LayoutGrid size={15} />
            </Button>
          </Tooltip>
          {showLayoutMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLayoutMenu(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
                {([
                  { dir: 'LR', label: 'Left → Right', Icon: AlignStartHorizontal },
                  { dir: 'TB', label: 'Top → Bottom',  Icon: AlignStartVertical },
                  { dir: 'RL', label: 'Right → Left',  Icon: AlignStartHorizontal },
                  { dir: 'BT', label: 'Bottom → Top',  Icon: AlignStartVertical },
                ] as const).map(({ dir, label, Icon }) => (
                  <button
                    key={dir}
                    onClick={() => { autoLayout(dir); setShowLayoutMenu(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon size={13} className="text-slate-400" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Reset ─────────────────────────────────────────── */}
        <Tooltip content="Reset canvas" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmReset(true)}
            disabled={isEmpty}
          >
            <RotateCcw size={15} />
          </Button>
        </Tooltip>

        <div className="mx-2 h-5 w-px bg-slate-200" />

        {/* ── Execution controls ─────────────────────────────── */}
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {/* Play / Resume */}
          <Tooltip content={isPaused ? 'Resume (F5)' : 'Run Workflow (F5)'} side="bottom">
            <button
              onClick={handleRun}
              disabled={isRunning || nodes.length === 0}
              className={[
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                'disabled:opacity-40 disabled:pointer-events-none',
                !isActive
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                  : isPaused
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                  : 'text-slate-400',
              ].join(' ')}
            >
              <Play size={13} className={!isActive || isPaused ? '' : 'opacity-30'} />
            </button>
          </Tooltip>

          {/* Pause */}
          <Tooltip content="Pause" side="bottom">
            <button
              onClick={pauseExecution}
              disabled={!isRunning}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-amber-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Pause size={13} />
            </button>
          </Tooltip>

          {/* Step */}
          <Tooltip content="Step Through" side="bottom">
            <button
              onClick={stepExecution}
              disabled={isRunning && !isPaused}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <SkipForward size={13} />
            </button>
          </Tooltip>

          {/* Stop */}
          <Tooltip content="Stop" side="bottom">
            <button
              onClick={stopExecution}
              disabled={!isActive}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Square size={13} />
            </button>
          </Tooltip>
        </div>

        <div className="flex-1" />

        {/* ── Validate ──────────────────────────────────────── */}
        <Tooltip content="Validate workflow" side="bottom">
          <Button variant="outline" size="sm" onClick={() => validateWorkflow()}>
            <CheckCircle2 size={13} />
            Validate
          </Button>
        </Tooltip>

        <div className="mx-1.5 h-5 w-px bg-slate-200" />

        {/* ── Version history ────────────────────────────────── */}
        <Tooltip content="Version history" side="bottom">
          <Button variant="outline" size="sm" onClick={() => onShowRunHistory ? onShowRunHistory() : setShowVersions(true)}>
            <History size={13} />
            History
          </Button>
        </Tooltip>

        {/* ── Save version ───────────────────────────────────── */}
        <Tooltip content="Save current version" side="bottom">
          <Button variant="outline" size="sm" onClick={() => saveVersion()} disabled={isEmpty}>
            <Save size={13} />
          </Button>
        </Tooltip>

        <div className="mx-1.5 h-5 w-px bg-slate-200" />

        {/* ── AI Builder ────────────────────────────────────── */}
        <Tooltip content="AI Workflow Builder" side="bottom">
          <Button variant="outline" size="sm" onClick={() => setShowAiBuilder(true)}>
            <Sparkles size={13} className="text-indigo-500" />
            AI Build
          </Button>
        </Tooltip>

        {/* ── Credentials ───────────────────────────────────── */}
        <Tooltip content="Credential Manager" side="bottom">
          <Button variant="ghost" size="icon" onClick={() => setShowCredentials(true)}>
            <Key size={15} />
          </Button>
        </Tooltip>

        {/* ── Monitoring ────────────────────────────────────── */}
        <Tooltip content="Monitoring Dashboard" side="bottom">
          <Button variant="ghost" size="icon" onClick={() => setShowMonitoring(true)}>
            <Activity size={15} />
          </Button>
        </Tooltip>

        <div className="mx-1.5 h-5 w-px bg-slate-200" />

        {/* ── Import ────────────────────────────────────────── */}
        <Tooltip content="Import JSON" side="bottom">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload size={13} />
            Import
          </Button>
        </Tooltip>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        {/* ── Export dropdown ───────────────────────────────── */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowExportMenu(o => !o)}
          >
            <Download size={13} />
            Export
            <ChevronDown size={11} className="ml-0.5 opacity-70" />
          </Button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
                <button
                  onClick={() => { handleExport(); setShowExportMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download size={13} className="text-slate-400" />
                  Export as JSON
                </button>
                <button
                  onClick={() => { handleExportPdf(); setShowExportMenu(false) }}
                  disabled={pdfExporting || nodes.length === 0}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {pdfExporting
                    ? <Loader2 size={13} className="animate-spin text-slate-400" />
                    : <FileText size={13} className="text-slate-400" />
                  }
                  {pdfExporting ? 'Generating…' : 'Export as PDF'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mx-1.5 h-5 w-px bg-slate-200" />

        {/* ── User avatar / profile ─────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(o => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white select-none">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-slate-800 leading-tight max-w-[120px] truncate">
                {user?.name ?? 'User'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight max-w-[120px] truncate">
                {user?.email ?? ''}
              </div>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-800 truncate">{user?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                  {user?.role && (
                    <span className="mt-1 inline-block rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 uppercase tracking-wide">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { logout(); setShowUserMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Dialogs / Panels ──────────────────────────────────── */}
      <ConfirmDialog
        open={confirmReset}
        title="Reset canvas"
        description="This will remove all nodes and edges. This action cannot be undone."
        confirmLabel="Reset"
        onConfirm={() => { resetFlow(); setConfirmReset(false) }}
        onCancel={() => setConfirmReset(false)}
      />

      {showVersions    && <VersionHistoryPanel onClose={() => setShowVersions(false)} />}
      {showCredentials && <CredentialManager   onClose={() => setShowCredentials(false)} />}
      {showMonitoring  && <MonitoringDashboard onClose={() => setShowMonitoring(false)} />}
      {showAiBuilder   && (
        <AiWorkflowBuilder
          onClose={() => setShowAiBuilder(false)}
          onApply={handleApplyAiWorkflow}
        />
      )}
    </>
  )
}

export default TopBar
