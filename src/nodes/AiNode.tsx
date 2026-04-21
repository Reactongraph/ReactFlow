import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Sparkles } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const AiNode: React.FC<NodeProps<NodeData>> = (props) => {
  const model = props.data.config?.model

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-purple-600 to-purple-700',
        icon:        <Sparkles size={14} />,
        badge: model ? (
          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
            {model}
          </span>
        ) : undefined,
        detail: model ? undefined : 'LLM · ML Inference',
        hasTarget: true,
        hasSource: true,
      }}
    />
  )
}

export default memo(AiNode)
