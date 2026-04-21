import React from 'react'
import { useFlowStore } from '../store'
import { NodeType } from '../types'

const Toolbar: React.FC = () => {
  const { addNode, deleteNode, resetFlow, selectedNodeId, autoLayout, exportWorkflow, importWorkflow } = useFlowStore()

  const handleAddNode = (type: NodeType) => {
    addNode(type, { x: Math.random() * 400, y: Math.random() * 400 })
  }

  const handleDeleteNode = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const json = e.target?.result as string
        importWorkflow(json)
      }
      reader.readAsText(file)
    }
  }

  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2 p-4 bg-gray-100 border-b">
      <button
        onClick={() => handleAddNode('input')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Input Node
      </button>
      <button
        onClick={() => handleAddNode('processing')}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Add Processing Node
      </button>
      <button
        onClick={() => handleAddNode('output')}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Add Output Node
      </button>
      <button
        onClick={handleDeleteNode}
        disabled={!selectedNodeId}
        className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50"
      >
        Delete Selected Node
      </button>
      <button
        onClick={resetFlow}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Reset Canvas
      </button>
      <button
        onClick={autoLayout}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        Auto Arrange
      </button>
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Export JSON
      </button>
      <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
        Import JSON
        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
      </label>
    </div>
  )
}

export default Toolbar