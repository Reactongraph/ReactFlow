import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Sparkles } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'
import { Badge } from '../components/ui/Badge'

const AiNode: React.FC<NodeProps<NodeData>> = (props) => {
  const model = props.data.config?.model

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-purple-600 to-purple-700',
        icon: <Sparkles size={14} />,
        hasTarget: true,
        hasSource: true,
        children: model ? (
          <Badge color="bg-purple-50 text-purple-700">{model}</Badge>
        ) : undefined,
      }}
    />
  )
}

export default memo(AiNode)
