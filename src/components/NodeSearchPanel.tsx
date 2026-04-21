import React, { useState } from 'react'
import { useFlowStore } from '../store'
import { NodeType } from '../types'

const nodeTypes: { type: NodeType; label: string; color: string }[] = [
  { type: 'input', label: 'Input Node', color: 'bg-blue-500' },
  { type: 'processing', label: 'Processing Node', color: 'bg-green-500' },
  { type: 'output', label: 'Output Node', color: 'bg-red-500' },
]

const NodeSearchPanel: React.FC = () => {
  const { templates } = useFlowStore()
  const [search, setSearch] = useState('')

  const filteredTypes = nodeTypes.filter(type =>
    type.label.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTemplates = Object.entries(templates).filter(([, template]) =>
    template.data.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleDragStart = (event: React.DragEvent, type: NodeType | string, isTemplate: boolean) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ type, isTemplate }))
  }

  return (
    <div className="w-64 p-4 bg-gray-50 border-r">
      <h3 className="text-lg font-semibold mb-4">Node Library</h3>
      <input
        type="text"
        placeholder="Search nodes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
      />
      <div className="space-y-2">
        {filteredTypes.map(({ type, label, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type, false)}
            className={`p-2 ${color} text-white rounded cursor-move hover:opacity-80`}
          >
            {label}
          </div>
        ))}
        {filteredTemplates.map(([id, template]) => (
          <div
            key={id}
            draggable
            onDragStart={(e) => handleDragStart(e, id, true)}
            className="p-2 bg-purple-500 text-white rounded cursor-move hover:opacity-80"
          >
            Template: {template.data.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NodeSearchPanel