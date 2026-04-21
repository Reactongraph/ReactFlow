import React from 'react'
import { useFlowStore } from '../store'

const ValidationPanel: React.FC = () => {
  const { validation } = useFlowStore()

  if (validation.errors.length === 0) {
    return (
      <div className="w-80 p-4 bg-green-50 border-l border-t">
        <h3 className="text-lg font-semibold mb-4 text-green-800">Validation</h3>
        <p className="text-green-700">✓ Workflow is valid</p>
      </div>
    )
  }

  return (
    <div className="w-80 p-4 bg-red-50 border-l border-t">
      <h3 className="text-lg font-semibold mb-4 text-red-800">Validation Errors</h3>
      <ul className="space-y-2">
        {validation.errors.map(error => (
          <li key={error.id} className="text-red-700 text-sm">
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ValidationPanel