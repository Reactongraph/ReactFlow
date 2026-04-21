import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { CustomNode } from '../types'

interface OutputNodeProps {
  data: CustomNode['data']
}

const OutputNode: React.FC<OutputNodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-red-500 text-white border-2 border-red-700">
      <div className="font-bold">{data.label}</div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-700"
      />
    </div>
  )
}

export default memo(OutputNode)