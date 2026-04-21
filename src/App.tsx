import React from 'react'
import FlowCanvas      from './flow/FlowCanvas'
import TopBar          from './components/layout/TopBar'
import StatusBar       from './components/layout/StatusBar'
import NodeLibrary     from './components/NodeLibrary'
import PropertyPanel   from './components/PropertyPanel'
import ValidationPanel from './components/ValidationPanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useValidation }        from './hooks/useValidation'

const App: React.FC = () => {
  useKeyboardShortcuts()
  useValidation()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans antialiased">
      {/* ── Top navigation bar ─────────────────────────────── */}
      <TopBar />

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

      {/* ── Bottom status bar ──────────────────────────────── */}
      <StatusBar />
    </div>
  )
}

export default App
