import React from 'react'
import { useFlowStore } from '../store'

const SidePanel: React.FC = () => {
  const { selectedNodeId, nodes, updateNode } = useFlowStore()

  const selectedNode = nodes.find((node) => node.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="w-80 p-4 bg-gray-50 border-l">
        <h3 className="text-lg font-semibold mb-4">Node Properties</h3>
        <p className="text-gray-500">Select a node to view its properties.</p>
      </div>
    )
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, label: e.target.value },
    })
  }

  return (
    <div className="w-80 p-4 bg-gray-50 border-l">
      <h3 className="text-lg font-semibold mb-4">Node Properties</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Label
          </label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={handleLabelChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <p className="mt-1 text-sm text-gray-900">{selectedNode.type}</p>
        </div>
        {/* Add more properties as needed */}
      </div>
    </div>
  )
}

export default SidePanel