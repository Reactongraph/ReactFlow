import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData, NodeStatus } from '../types'
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useFlowStore } from '../store'

export interface BaseNodeConfig {
  headerColor: string
  icon: React.ReactNode
  badge?: React.ReactNode
  detail?: string
  hasTarget?: boolean
  hasSource?: boolean
  extraSources?: Array<{ id: string; topPct: number; label: string }>
}

interface BaseNodeProps extends NodeProps<NodeData> {
  config: BaseNodeConfig
}

const STATUS_ICON: Record<NodeStatus, React.ReactNode> = {
  idle:    null,
  running: <Loader2    size={12} className="animate-spin text-white/80" />,
  success: <CheckCircle2 size={12} className="text-emerald-300" />,
  error:   <XCircle    size={12} className="text-red-300" />,
  warning: <AlertTriangle size={12} className="text-amber-300" />,
}

// ── Handle dot — positioned relative to the outer wrapper ─────
const Dot: React.FC<{
  type: 'source' | 'target'
  id?: string
  topPct?: number
}> = ({ type, id, topPct = 50 }) => (
  <Handle
    type={type}
    position={type === 'target' ? Position.Left : Position.Right}
    id={id}
    style={{ top: `${topPct}%`, transform: 'translateY(-50%)' }}
  />
)

// ── Main node ─────────────────────────────────────────────────
const BaseNode: React.FC<BaseNodeProps> = ({ id, data, selected, config }) => {
  const { headerColor, icon, badge, detail, hasTarget, hasSource, extraSources = [] } = config

  const status       = data.status ?? 'idle'
  const isBreakpoint = useFlowStore(s => s.execution.breakpoints.has(id))
  const isCurrent    = useFlowStore(s => s.execution.currentNodeId === id)
  const execResult   = useFlowStore(s => s.execution.results[id])
  const execStatus   = useFlowStore(s => s.execution.status)

  const showTiming = !!execResult &&
    (execStatus === 'completed' || execStatus === 'failed' || execStatus === 'paused')

  const hasBody = !!(badge || detail || data.description)

  // Card ring / shadow based on state
  const cardCls = selected
    ? 'border-indigo-400 shadow-[0_0_0_2px_#6366f1,0_4px_16px_rgba(99,102,241,0.25)]'
    : isCurrent
    ? 'border-indigo-300 shadow-[0_0_0_3px_rgba(99,102,241,0.3),0_4px_12px_rgba(0,0,0,0.08)] animate-pulse'
    : status === 'success'
    ? 'border-emerald-300 shadow-node'
    : status === 'error'
    ? 'border-red-300 shadow-node'
    : 'border-slate-200 shadow-node hover:border-slate-300 hover:shadow-md'

  return (
    /*
     * Outer wrapper — owns `relative` for handle + badge positioning.
     * NO overflow-hidden here so handles are never clipped.
     */
    <div className="relative w-52 select-none">

      {/* ── Breakpoint dot (outside card left edge) ─────────── */}
      {isBreakpoint && (
        <span
          title="Breakpoint"
          className="absolute -left-2 top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white shadow"
        />
      )}

      {/* ── Timing badge (below card) ────────────────────────── */}
      {showTiming && execResult && (
        <span
          className={[
            'absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap',
            'rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-white shadow-sm',
            execResult.status === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700',
          ].join(' ')}
        >
          {Math.round(execResult.duration)}ms
        </span>
      )}

      {/* ── Connection handles ───────────────────────────────── */}
      {hasTarget && <Dot type="target" topPct={50} />}
      {hasSource && extraSources.length === 0 && <Dot type="source" topPct={50} />}
      {extraSources.map(({ id: hid, topPct, label }) => (
        <React.Fragment key={hid}>
          <Dot type="source" id={hid} topPct={topPct} />
          <span
            className="pointer-events-none absolute right-4 z-10 -translate-y-1/2 text-[9px] font-medium text-slate-400"
            style={{ top: `${topPct}%` }}
          >
            {label}
          </span>
        </React.Fragment>
      ))}

      {/*
       * Inner card — overflow-hidden keeps the gradient header
       * cleanly clipped inside the rounded corners.
       * No rounded classes needed on children; the parent clips them.
       */}
      <div className={[
        'overflow-hidden rounded-xl border bg-white transition-all duration-150',
        cardCls,
      ].join(' ')}>

        {/* Header */}
        <div className={`flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r ${headerColor}`}>
          <span className="shrink-0 text-white/90">{icon}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
            {data.label}
          </span>
          <span className="shrink-0">{STATUS_ICON[status]}</span>
        </div>

        {/* Body */}
        {hasBody && (
          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            {badge && <div className="flex items-center gap-1.5">{badge}</div>}
            {detail && (
              <p className="truncate text-[11px] text-slate-400">{detail}</p>
            )}
            {data.description && (
              <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                {data.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(BaseNode)
