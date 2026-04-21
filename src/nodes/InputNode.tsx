import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { CustomNode } from '../types'

interface InputNodeProps {
  data: CustomNode['data']
}

const InputNode: React.FC<InputNodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-500 text-white border-2 border-blue-700">
      <div className="font-bold">{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-700"
      />
    </div>
  )
}

export default memo(InputNode)