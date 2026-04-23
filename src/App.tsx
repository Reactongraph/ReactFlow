import React, { useCallback, useState, useEffect } from 'react'
import FlowCanvas      from './flow/FlowCanvas'
import TopBar          from './components/layout/TopBar'
import StatusBar       from './components/layout/StatusBar'
import NodeLibrary     from './components/NodeLibrary'
import PropertyPanel   from './components/PropertyPanel'
import ValidationPanel from './components/ValidationPanel'
import ExecutionPanel  from './components/panels/ExecutionPanel'
import CommandPalette  from './components/CommandPalette'
import AuthPage        from './components/auth/AuthPage'
import RunHistoryPanel from './components/panels/RunHistoryPanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useValidation }        from './hooks/useValidation'
import { useAuthStore }         from './store/slices/auth'
import { useWalkthrough, hasTourBeenSeen } from './hooks/useWalkthrough'

const App: React.FC = () => {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [showRunHistory, setShowRunHistory]  = useState(false)

  const { isLoggedIn, loadUser } = useAuthStore()
  const { start, restart }       = useWalkthrough()

  const openPalette  = useCallback(() => setCmdPaletteOpen(true),  [])
  const closePalette = useCallback(() => setCmdPaletteOpen(false), [])

  useKeyboardShortcuts(openPalette)
  useValidation()

  // Restore session on mount
  useEffect(() => { loadUser() }, [loadUser])

  // Auto-start tour on first login — slight delay so the UI is fully painted
  useEffect(() => {
    if (!isLoggedIn) return
    if (!hasTourBeenSeen()) {
      const t = setTimeout(() => start(), 800)
      return () => clearTimeout(t)
    }
  }, [isLoggedIn, start])

  // Keyboard shortcut: ? restarts the tour
  useEffect(() => {
    if (!isLoggedIn) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') restart()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLoggedIn, restart])

  // ── Auth gate ─────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <AuthPage onSuccess={() => { /* state updates automatically */ }} />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans antialiased">

      {/* ── Top navigation bar ─────────────────────────────── */}
      <TopBar
        onOpenCommandPalette={openPalette}
        onShowRunHistory={() => setShowRunHistory(true)}
      />

      {/* ── Main work area ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Node Library */}
        <NodeLibrary />

        {/* Center: Canvas */}
        <main className="relative flex-1 overflow-hidden">
          <FlowCanvas />
        </main>

        {/* Right: Property inspector + validation */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-slate-200">
          <PropertyPanel />
          <ValidationPanel />
        </div>
      </div>

      {/* ── Execution panel (collapsible) ──────────────────── */}
      <ExecutionPanel />

      {/* ── Bottom status bar ──────────────────────────────── */}
      <StatusBar />

      {/* ── Command palette overlay ─────────────────────────── */}
      {cmdPaletteOpen && <CommandPalette onClose={closePalette} />}

      {/* ── Run history modal ────────────────────────────────── */}
      {showRunHistory && (
        <RunHistoryPanel onClose={() => setShowRunHistory(false)} />
      )}

      {/* ── Help / Tour button ───────────────────────────────── */}
      <button
        onClick={restart}
        title="Restart tour (or press ?)"
        className="fixed bottom-10 right-4 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:scale-110 text-sm font-bold"
      >
        ?
      </button>
    </div>
  )
}

export default App
