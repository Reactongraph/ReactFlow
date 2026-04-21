import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Shuffle } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'
import { Badge } from '../components/ui/Badge'

const TransformNode: React.FC<NodeProps<NodeData>> = (props) => {
  const type = props.data.config?.transformType

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-cyan-500 to-cyan-600',
        icon: <Shuffle size={14} />,
        hasTarget: true,
        hasSource: true,
        children: type ? (
          <Badge color="bg-cyan-50 text-cyan-700">{type}</Badge>
        ) : undefined,
      }}
    />
  )
}

export default memo(TransformNode)
