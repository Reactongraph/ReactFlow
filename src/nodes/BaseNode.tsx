import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData, NodeStatus } from '../types'
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'

export interface BaseNodeConfig {
  headerColor: string        // e.g. 'from-blue-500 to-blue-600'
  icon: React.ReactNode
  hasTarget?: boolean
  hasSource?: boolean
  /** Extra source handles for decision nodes: [{id, style}] */
  extraSources?: Array<{ id: string; style?: React.CSSProperties; label?: string }>
  children?: React.ReactNode
}

interface BaseNodeProps extends NodeProps<NodeData> {
  config: BaseNodeConfig
}

const statusIcon: Record<NodeStatus, React.ReactNode> = {
  idle:    null,
  running: <Loader2 size={11} className="animate-spin text-white/80" />,
  success: <CheckCircle2 size={11} className="text-emerald-300" />,
  error:   <XCircle size={11} className="text-red-300" />,
  warning: <AlertTriangle size={11} className="text-amber-300" />,
}

const BaseNode: React.FC<BaseNodeProps> = ({ data, selected, config }) => {
  const {
    headerColor,
    icon,
    hasTarget = false,
    hasSource = false,
    extraSources = [],
    children,
  } = config

  const status = data.status ?? 'idle'

  return (
    <div
      className={[
        'relative min-w-[180px] rounded-xl bg-white transition-all duration-150',
        'border',
        selected
          ? 'border-indigo-400 shadow-node-selected'
          : 'border-slate-200/80 shadow-node hover:border-slate-300 hover:shadow-md',
      ].join(' ')}
    >
      {/* ── Left handle (target) ─────────────────────────────── */}
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-slate-400 !border-white"
          style={{ top: '50%' }}
        />
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 rounded-t-xl bg-gradient-to-r px-3 py-2 ${headerColor}`}>
        <span className="text-white/90">{icon}</span>
        <span className="flex-1 truncate text-sm font-semibold text-white">
          {data.label}
        </span>
        <span className="shrink-0">{statusIcon[status]}</span>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      {(data.description || children) && (
        <div className="px-3 py-2 text-xs text-slate-500 space-y-1">
          {data.description && (
            <p className="leading-relaxed">{data.description}</p>
          )}
          {children}
        </div>
      )}

      {/* ── Right handle (source) ────────────────────────────── */}
      {hasSource && extraSources.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-slate-400 !border-white"
          style={{ top: '50%' }}
        />
      )}

      {/* ── Extra named source handles (Decision node) ───────── */}
      {extraSources.map(({ id, style, label }) => (
        <React.Fragment key={id}>
          <Handle
            type="source"
            position={Position.Right}
            id={id}
            className="!bg-slate-400 !border-white"
            style={style}
          />
          {label && (
            <span
              className="absolute right-3 text-[9px] font-medium text-slate-400 pointer-events-none"
              style={{ top: style?.top ? `calc(${style.top} - 2px)` : undefined }}
            >
              {label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default memo(BaseNode)
