import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Globe } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'
import { Badge } from '../components/ui/Badge'

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100 text-blue-700',
  PUT:    'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH:  'bg-purple-100 text-purple-700',
}

const ApiNode: React.FC<NodeProps<NodeData>> = (props) => {
  const method  = props.data.config?.method ?? 'GET'
  const url     = props.data.config?.url

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-amber-500 to-amber-600',
        icon: <Globe size={14} />,
        hasTarget: true,
        hasSource: true,
        children: (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge color={METHOD_COLOR[method] ?? METHOD_COLOR.GET}>{method}</Badge>
            {url && (
              <span className="truncate text-[10px] text-slate-400 max-w-[110px]">{url}</span>
            )}
          </div>
        ),
      }}
    />
  )
}

export default memo(ApiNode)
