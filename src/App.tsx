import React from 'react'
import Toolbar from './components/Toolbar'
import FlowCanvas from './flow/FlowCanvas'
import SidePanel from './components/SidePanel'
import NodeSearchPanel from './components/NodeSearchPanel'
import ValidationPanel from './components/ValidationPanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const App: React.FC = () => {
  useKeyboardShortcuts()

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex flex-1">
        <NodeSearchPanel />
        <div className="flex-1">
          <FlowCanvas />
        </div>
        <div className="flex flex-col">
          <SidePanel />
          <ValidationPanel />
        </div>
      </div>
    </div>
  )
}

export default App