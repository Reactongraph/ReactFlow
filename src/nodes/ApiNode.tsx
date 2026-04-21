import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Globe } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const METHOD_CLS: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100    text-blue-700',
  PUT:    'bg-amber-100   text-amber-700',
  DELETE: 'bg-red-100     text-red-700',
  PATCH:  'bg-purple-100  text-purple-700',
}

const ApiNode: React.FC<NodeProps<NodeData>> = (props) => {
  const method = props.data.config?.method ?? 'GET'
  const url    = props.data.config?.url?.replace(/^https?:\/\//, '') // strip protocol for display

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: 'from-amber-500 to-amber-600',
        icon:        <Globe size={14} />,
        badge: (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${METHOD_CLS[method] ?? METHOD_CLS.GET}`}>
            {method}
          </span>
        ),
        detail: url || 'No URL configured',
        hasTarget: true,
        hasSource: true,
      }}
    />
  )
}

export default memo(ApiNode)
