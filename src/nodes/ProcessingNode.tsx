import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { CustomNode } from '../types'

interface ProcessingNodeProps {
  data: CustomNode['data']
}

const ProcessingNode: React.FC<ProcessingNodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-500 text-white border-2 border-green-700">
      <div className="font-bold">{data.label}</div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-700"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-700"
      />
    </div>
  )
}

export default memo(ProcessingNode)