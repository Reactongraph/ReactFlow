import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Cpu } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const ProcessingNode: React.FC<NodeProps<NodeData>> = (props) => (
  <BaseNode
    {...props}
    config={{
      headerColor: 'from-violet-500 to-violet-600',
      icon:        <Cpu size={14} />,
      detail:      props.data.config?.processingType
        ? `Mode: ${props.data.config.processingType}`
        : 'Custom script processing',
      hasTarget: true,
      hasSource: true,
    }}
  />
)

export default memo(ProcessingNode)
