import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { GitFork } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const DecisionNode: React.FC<NodeProps<NodeData>> = (props) => {
  const condition  = props.data.config?.condition
  const trueLabel  = props.data.config?.trueLabel  ?? 'Yes'
  const falseLabel = props.data.config?.falseLabel ?? 'No'

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-pink-500 to-pink-600',
        icon:        <GitFork size={14} />,
        badge: condition ? (
          <code className="block w-full truncate rounded bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-600">
            {condition}
          </code>
        ) : undefined,
        detail: condition ? undefined : 'No condition set',
        hasTarget: true,
        // Two named source handles: Yes (top) / No (bottom)
        extraSources: [
          { id: 'yes', topPct: 35, label: trueLabel  },
          { id: 'no',  topPct: 65, label: falseLabel },
        ],
      }}
    />
  )
}

export default memo(DecisionNode)
