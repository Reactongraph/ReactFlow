import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { GitFork } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const DecisionNode: React.FC<NodeProps<NodeData>> = (props) => {
  const trueLabel  = props.data.config?.trueLabel  ?? 'Yes'
  const falseLabel = props.data.config?.falseLabel ?? 'No'

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-pink-500 to-pink-600',
        icon: <GitFork size={14} />,
        hasTarget: true,
        extraSources: [
          { id: 'yes', style: { top: '35%' }, label: trueLabel },
          { id: 'no',  style: { top: '65%' }, label: falseLabel },
        ],
        children: props.data.config?.condition ? (
          <code className="text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-500 block truncate">
            {props.data.config.condition}
          </code>
        ) : undefined,
      }}
    />
  )
}

export default memo(DecisionNode)
