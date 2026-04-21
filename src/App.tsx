import React, { useCallback, useState } from 'react'
import FlowCanvas      from './flow/FlowCanvas'
import TopBar          from './components/layout/TopBar'
import StatusBar       from './components/layout/StatusBar'
import NodeLibrary     from './components/NodeLibrary'
import PropertyPanel   from './components/PropertyPanel'
import ValidationPanel from './components/ValidationPanel'
import ExecutionPanel  from './components/panels/ExecutionPanel'
import CommandPalette  from './components/CommandPalette'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useValidation }        from './hooks/useValidation'

const App: React.FC = () => {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)

  const openPalette  = useCallback(() => setCmdPaletteOpen(true),  [])
  const closePalette = useCallback(() => setCmdPaletteOpen(false), [])

  useKeyboardShortcuts(openPalette)
  useValidation()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans antialiased">

      {/* ── Top navigation bar ─────────────────────────────── */}
      <TopBar onOpenCommandPalette={openPalette} />

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
    </div>
  )
}

export default App
