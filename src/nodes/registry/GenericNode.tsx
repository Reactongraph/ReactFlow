import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { NodeData } from '../../types'
import BaseNode from '../BaseNode'
import { getNode } from './index'
import type { FieldSchema } from './types'

function buildDetail(
  config: Record<string, unknown>,
  fields: FieldSchema[],
): string | undefined {
  for (const f of fields) {
    const v = config[f.key]
    if (v && typeof v === 'string' && v.trim()) {
      return v.length > 40 ? v.slice(0, 40) + '…' : v
    }
  }
  return undefined
}

const GenericNode: React.FC<NodeProps<NodeData>> = (props) => {
  const def = getNode(props.type ?? '')

  const hasTarget   = def ? def.inputs.length > 0  : true
  const singleOut   = def ? def.outputs.length === 1 : true

  // Multi-output: one handle per output port
  const extraSources =
    def && def.outputs.length > 1
      ? def.outputs.map((p, i) => ({
          id: p.id,
          topPct: Math.round(((i + 1) / (def.outputs.length + 1)) * 100),
          label: p.label,
        }))
      : []

  return (
    <BaseNode
      {...props}
      config={{
        headerColor: def?.color ?? 'from-slate-500 to-slate-600',
        icon: def?.icon ?? null,
        detail: props.data.config
          ? buildDetail(props.data.config as Record<string, unknown>, def?.fields ?? [])
          : def?.description,
        hasTarget,
        hasSource: singleOut && extraSources.length === 0,
        extraSources,
      }}
    />
  )
}

export default memo(GenericNode)
