import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { ArrowDownToLine } from 'lucide-react'
import BaseNode from './BaseNode'
import { NodeData } from '../types'

const InputNode: React.FC<NodeProps<NodeData>> = (props) => (
  <BaseNode
    {...props}
    config={{
      headerColor: 'from-blue-500 to-blue-600',
      icon: <ArrowDownToLine size={14} />,
      hasSource: true,
    }}
  />
)

export default memo(InputNode)
