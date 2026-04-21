import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Shuffle } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const TransformNode: React.FC<NodeProps<NodeData>> = (props) => {
  const type = props.data.config?.transformType

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-cyan-500 to-cyan-600',
        icon:        <Shuffle size={14} />,
        badge: type ? (
          <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-cyan-700">
            {type}
          </span>
        ) : undefined,
        detail: type ? undefined : 'Map · Filter · Reduce · Aggregate',
        hasTarget: true,
        hasSource: true,
      }}
    />
  )
}

export default memo(TransformNode)
