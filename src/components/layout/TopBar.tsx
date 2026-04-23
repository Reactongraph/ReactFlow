import React, { useRef, useState } from 'react'
import {
  Workflow, Undo2, Redo2, LayoutGrid, CheckCircle2,
  Download, Upload, RotateCcw, ChevronDown,
  Play, Pause, Square, SkipForward, History, Save,
  AlignStartVertical, AlignStartHorizontal,
  Command, FileText, Loader2, LogOut,
  Key, Activity, Sparkles, BookMarked, GitBranch,
  MoreHorizontal,
} from 'lucide-react'
import { useFlowStore } from '../../store'
import { useAuthStore } from '../../store/slices/auth'
import { Tooltip } from '../ui/Tooltip'
import ConfirmDialog from '../ui/ConfirmDialog'
import VersionHistoryPanel from '../panels/VersionHistoryPanel'
import { CredentialManager } from '../panels/CredentialManager'
import { MonitoringDashboard } from '../panels/MonitoringDashboard'
import { AiWorkflowBuilder } from '../panels/AiWorkflowBuilder'
import TemplatesPanel from '../panels/TemplatesPanel'
import type { GeneratedWorkflow } from '../../services/ai-builder.service'

interface TopBarProps {
  onOpenCommandPalette: () => void
  onShowRunHistory?: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette, onShowRunHistory }) => {
  const {
    workflowName, setWorkflowName,
    savedWorkflowId, saveWorkflowToBackend,
    undo, redo, history,
    autoLayout, validateWorkflow,
    exportWorkflow, importWorkflow,
    resetFlow, nodes, edges,
    execution,
    startExecution, pauseExecution, resumeExecution, stopExecution, stepExecution,
    rfInstance,
  } = useFlowStore()

  const { user, logout } = useAuthStore()

  const [editingName,     setEditingName]     = useState(false)
  const [nameValue,       setNameValue]       = useState(workflowName)
  const [confirmReset,    setConfirmReset]    = useState(false)
  const [showVersions,    setShowVersions]    = useState(false)
  const [showTemplates,   setShowTemplates]   = useState(false)
  const [showLayoutMenu,  setShowLayoutMenu]  = useState(false)
  const [showMoreMenu,    setShowMoreMenu]    = useState(false)
  const [showUserMenu,    setShowUserMenu]    = useState(false)
  const [pdfExporting,    setPdfExporting]    = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [saveMsg,         setSaveMsg]         = useState<string | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showMonitoring,  setShowMonitoring]  = useState(false)
  const [showAiBuilder,   setShowAiBuilder]   = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const userInitials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0
  const isEmpty = nodes.length === 0 && edges.length === 0

  const { status } = execution
  const isRunning  = status === 'running'
  const isPaused   = status === 'paused'
  const isActive   = isRunning || isPaused

  /* ── Handlers ───────────────────────────────────────────── */
  const commitName = () => {
    setWorkflowName(nameValue.trim() || 'Untitled Workflow')
    setEditingName(false)
  }

  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `${workflowName.replace(/\s+/g, '_')}.json`,
    })
    a.click(); URL.revokeObjectURL(url)
  }

  const handleExportPdf = async () => {
    if (pdfExporting) return
    setPdfExporting(true)
    try {
      rfInstance?.fitView({ padding: 0.12, duration: 0 })
      await new Promise(r => setTimeout(r, 120))
      const { exportWorkflowAsPdf } = await import('../../utils/exportPdf')
      await exportWorkflowAsPdf({ workflowName, nodeCount: nodes.length, edgeCount: edges.length })
    } finally { setPdfExporting(false) }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { try { importWorkflow(ev.target?.result as string) } catch { /* */ } }
    reader.readAsText(file); e.target.value = ''
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true); setSaveMsg(null)
    try {
      await saveWorkflowToBackend()
      setSaveMsg('Saved'); setTimeout(() => setSaveMsg(null), 2000)
    } catch {
      setSaveMsg('Failed'); setTimeout(() => setSaveMsg(null), 3000)
    } finally { setSaving(false) }
  }

  const handleApplyAiWorkflow = (wf: GeneratedWorkflow) => {
    const mappedNodes = wf.nodes.map(n => ({
      id: n.id, type: 'customNode', position: n.position,
      data: { label: n.label, nodeType: n.type, ...n.data, inputs: [], outputs: [], status: 'idle' as const },
    }))
    importWorkflow(JSON.stringify({ nodes: mappedNodes, edges: wf.edges, workflowName: wf.name }))
    setShowAiBuilder(false)
  }

  const handleRun = () => { if (isPaused) resumeExecution(); else startExecution() }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <header className="flex h-11 shrink-0 items-center border-b border-slate-200 bg-white px-2 gap-0.5">

        {/* ── Logo ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200 mr-1 shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
            <Workflow size={13} className="text-white" />
          </div>
          <span className="text-xs font-bold text-slate-800 hidden lg:block">FlowBuilder</span>
        </div>

        {/* ── Workflow name ─────────────────────────────────── */}
        {editingName ? (
          <input
            autoFocus value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
            className="h-6 w-36 rounded border border-indigo-300 bg-white px-1.5 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-400"
          />
        ) : (
          <button
            onClick={() => { setNameValue(workflowName); setEditingName(true) }}
            className="flex max-w-[140px] items-center gap-0.5 rounded px-1.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <span className="truncate">{workflowName}</span>
            <ChevronDown size={10} className="text-slate-400 shrink-0" />
          </button>
        )}

        {/* ── Cmd palette ──────────────────────────────────── */}
        <Tooltip content="Command Palette (Ctrl+K)" side="bottom">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shrink-0"
          >
            <Command size={10} />
            <span className="hidden xl:inline">Ctrl K</span>
          </button>
        </Tooltip>

        <div className="mx-1.5 h-4 w-px bg-slate-200 shrink-0" />

        {/* ── Undo / Redo ───────────────────────────────────── */}
        <Tooltip content="Undo (Ctrl+Z)" side="bottom">
          <button onClick={undo} disabled={!canUndo}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <Undo2 size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Shift+Z)" side="bottom">
          <button onClick={redo} disabled={!canRedo}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <Redo2 size={14} />
          </button>
        </Tooltip>

        {/* ── Layout ───────────────────────────────────────── */}
        <div className="relative">
          <Tooltip content="Auto Layout" side="bottom">
            <button onClick={() => setShowLayoutMenu(o => !o)} disabled={isEmpty}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <LayoutGrid size={14} />
            </button>
          </Tooltip>
          {showLayoutMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLayoutMenu(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {([
                  { dir: 'LR', label: 'Left → Right', Icon: AlignStartHorizontal },
                  { dir: 'TB', label: 'Top → Bottom',  Icon: AlignStartVertical },
                  { dir: 'RL', label: 'Right → Left',  Icon: AlignStartHorizontal },
                  { dir: 'BT', label: 'Bottom → Top',  Icon: AlignStartVertical },
                ] as const).map(({ dir, label, Icon }) => (
                  <button key={dir} onClick={() => { autoLayout(dir); setShowLayoutMenu(false) }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                    <Icon size={12} className="text-slate-400" />{label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Reset ────────────────────────────────────────── */}
        <Tooltip content="Reset canvas" side="bottom">
          <button onClick={() => setConfirmReset(true)} disabled={isEmpty}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <RotateCcw size={14} />
          </button>
        </Tooltip>

        <div className="mx-1.5 h-4 w-px bg-slate-200 shrink-0" />

        {/* ── Execution controls ────────────────────────────── */}
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
          <Tooltip content={isPaused ? 'Resume' : 'Run'} side="bottom">
            <button onClick={handleRun} disabled={isRunning || isEmpty}
              className={[
                'flex h-6 w-6 items-center justify-center rounded transition-colors',
                'disabled:opacity-40 disabled:pointer-events-none',
                !isActive || isPaused ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm' : 'text-slate-400',
              ].join(' ')}>
              <Play size={11} />
            </button>
          </Tooltip>
          <Tooltip content="Pause" side="bottom">
            <button onClick={pauseExecution} disabled={!isRunning}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-amber-600 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <Pause size={11} />
            </button>
          </Tooltip>
          <Tooltip content="Step" side="bottom">
            <button onClick={stepExecution} disabled={isRunning && !isPaused}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <SkipForward size={11} />
            </button>
          </Tooltip>
          <Tooltip content="Stop" side="bottom">
            <button onClick={stopExecution} disabled={!isActive}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <Square size={11} />
            </button>
          </Tooltip>
        </div>

        {/* ── Spacer ───────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── RIGHT ZONE: icon-only tools ──────────────────── */}

        {/* Validate */}
        <Tooltip content="Validate" side="bottom">
          <button onClick={() => validateWorkflow()}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
            <CheckCircle2 size={14} />
          </button>
        </Tooltip>

        {/* AI Builder */}
        <Tooltip content="AI Workflow Builder" side="bottom">
          <button onClick={() => setShowAiBuilder(true)}
            className="flex h-7 w-7 items-center justify-center rounded text-indigo-500 hover:bg-indigo-50 transition-colors">
            <Sparkles size={14} />
          </button>
        </Tooltip>

        {/* Templates */}
        <Tooltip content="Node Templates" side="bottom">
          <button onClick={() => setShowTemplates(true)}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
            <BookMarked size={14} />
          </button>
        </Tooltip>

        {/* Version History */}
        <Tooltip content="Version History" side="bottom">
          <button onClick={() => setShowVersions(true)}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
            <GitBranch size={14} />
          </button>
        </Tooltip>

        {/* Run History */}
        <Tooltip content="Run History" side="bottom">
          <button onClick={() => onShowRunHistory?.()}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
            <History size={14} />
          </button>
        </Tooltip>

        {/* Monitoring */}
        <Tooltip content="Monitoring" side="bottom">
          <button onClick={() => setShowMonitoring(true)}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
            <Activity size={14} />
          </button>
        </Tooltip>

        {/* Credentials */}
        <Tooltip content="Credentials" side="bottom">
          <button onClick={() => setShowCredentials(true)}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
            <Key size={14} />
          </button>
        </Tooltip>

        <div className="mx-1.5 h-4 w-px bg-slate-200 shrink-0" />

        {/* ── More menu (Import / Export) ───────────────────── */}
        <div className="relative">
          <Tooltip content="Import / Export" side="bottom">
            <button onClick={() => setShowMoreMenu(o => !o)}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </Tooltip>
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button onClick={() => { importRef.current?.click(); setShowMoreMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                  <Upload size={13} className="text-slate-400" /> Import JSON
                </button>
                <button onClick={() => { handleExport(); setShowMoreMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                  <Download size={13} className="text-slate-400" /> Export JSON
                </button>
                <button onClick={() => { handleExportPdf(); setShowMoreMenu(false) }}
                  disabled={pdfExporting || isEmpty}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  {pdfExporting
                    ? <Loader2 size={13} className="animate-spin text-slate-400" />
                    : <FileText size={13} className="text-slate-400" />}
                  {pdfExporting ? 'Generating…' : 'Export PDF'}
                </button>
              </div>
            </>
          )}
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        {/* ── Save ─────────────────────────────────────────── */}
        <Tooltip content={savedWorkflowId ? 'Save changes' : 'Save workflow'} side="bottom">
          <button onClick={handleSave} disabled={isEmpty || saving}
            className={[
              'flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors',
              'disabled:opacity-40 disabled:pointer-events-none',
              saveMsg === 'Saved'
                ? 'bg-emerald-50 text-emerald-600'
                : saveMsg === 'Failed'
                ? 'bg-red-50 text-red-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700',
            ].join(' ')}>
            {saving
              ? <Loader2 size={12} className="animate-spin" />
              : <Save size={12} />}
            {saveMsg ?? 'Save'}
          </button>
        </Tooltip>

        <div className="mx-1.5 h-4 w-px bg-slate-200 shrink-0" />

        {/* ── User menu ────────────────────────────────────── */}
        <div className="relative shrink-0">
          <button onClick={() => setShowUserMenu(o => !o)}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-slate-100 transition-colors">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white select-none shrink-0">
              {userInitials}
            </div>
            <span className="hidden xl:block max-w-[100px] truncate text-xs font-medium text-slate-700">
              {user?.name ?? 'User'}
            </span>
            <ChevronDown size={10} className="text-slate-400 shrink-0" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
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
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Dialogs ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmReset}
        title="Reset canvas"
        description="This will remove all nodes and edges. This action cannot be undone."
        confirmLabel="Reset"
        onConfirm={() => { resetFlow(); setConfirmReset(false) }}
        onCancel={() => setConfirmReset(false)}
      />
      {showVersions    && <VersionHistoryPanel onClose={() => setShowVersions(false)} />}
      {showTemplates   && <TemplatesPanel      onClose={() => setShowTemplates(false)} />}
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
