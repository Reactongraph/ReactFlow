import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { ArrowUpFromLine } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const OutputNode: React.FC<NodeProps<NodeData>> = (props) => (
  <BaseNode
    {...props}
    config={{
      headerColor: 'from-emerald-500 to-emerald-600',
      icon:        <ArrowUpFromLine size={14} />,
      detail:      props.data.config?.format
        ? `Format: ${props.data.config.format.toUpperCase()}`
        : 'Result destination',
      hasTarget: true,
    }}
  />
)

export default memo(OutputNode)
