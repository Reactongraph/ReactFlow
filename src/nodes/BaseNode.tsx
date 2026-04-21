import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData, NodeStatus } from '../types'
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useFlowStore } from '../store'

export interface BaseNodeConfig {
  headerColor: string          // Tailwind gradient classes
  icon: React.ReactNode
  badge?: React.ReactNode      // Small info shown in the body (method, model, type…)
  detail?: string              // Secondary text line in the body
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

// ── Handle component (DRY) ─────────────────────────────────────
const Dot: React.FC<{ type: 'source' | 'target'; id?: string; topPct?: number }> = ({
  type, id, topPct = 50,
}) => (
  <Handle
    type={type}
    position={type === 'target' ? Position.Left : Position.Right}
    id={id}
    style={{ top: `${topPct}%`, transform: 'translateY(-50%)' }}
  />
)

// ── Main node card ─────────────────────────────────────────────
const BaseNode: React.FC<BaseNodeProps> = ({ id, data, selected, config }) => {
  const { headerColor, icon, badge, detail, hasTarget, hasSource, extraSources = [] } = config

  const status      = data.status ?? 'idle'
  const isBreakpoint = useFlowStore(s => s.execution.breakpoints.has(id))
  const isCurrent    = useFlowStore(s => s.execution.currentNodeId === id)
  const execResult   = useFlowStore(s => s.execution.results[id])
  const execStatus   = useFlowStore(s => s.execution.status)

  const showTiming = !!execResult &&
    (execStatus === 'completed' || execStatus === 'failed' || execStatus === 'paused')

  // Body content: badge, detail, description — at least one must exist
  const bodyContent = badge || detail || data.description
  const hasBody     = !!bodyContent

  return (
    <div
      className={[
        // Fixed width so every node is the same size
        'relative w-52 select-none rounded-xl bg-white',
        'border transition-all duration-150',
        // Ring states: selected > running-current > success > error > default
        selected
          ? 'border-indigo-400 shadow-[0_0_0_2px_#6366f1,0_4px_16px_rgba(99,102,241,0.25)]'
          : isCurrent
          ? 'border-indigo-300 shadow-[0_0_0_3px_rgba(99,102,241,0.35),0_4px_12px_rgba(0,0,0,0.1)] animate-[pulse_1.5s_ease-in-out_infinite]'
          : status === 'success'
          ? 'border-emerald-300 shadow-node'
          : status === 'error'
          ? 'border-red-300 shadow-node'
          : 'border-slate-200 shadow-node hover:border-slate-300 hover:shadow-md',
      ].join(' ')}
    >
      {/* ── Breakpoint indicator ───────────────────────────── */}
      {isBreakpoint && (
        <span
          title="Breakpoint"
          className="absolute -left-1.5 top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white shadow-sm"
        />
      )}

      {/* ── Execution timing badge ─────────────────────────── */}
      {showTiming && execResult && (
        <span
          className={[
            'absolute -bottom-2.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap',
            'rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-white shadow-sm',
            execResult.status === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700',
          ].join(' ')}
        >
          {Math.round(execResult.duration)}ms
        </span>
      )}

      {/* ── Target handle (left) ───────────────────────────── */}
      {hasTarget && <Dot type="target" topPct={50} />}

      {/* ── Header ────────────────────────────────────────── */}
      <div
        className={[
          'flex items-center gap-2 px-3 py-2.5',
          `bg-gradient-to-r ${headerColor}`,
          hasBody ? 'rounded-t-xl' : 'rounded-xl',
        ].join(' ')}
      >
        <span className="shrink-0 text-white/90">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
          {data.label}
        </span>
        <span className="shrink-0">{STATUS_ICON[status]}</span>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      {hasBody && (
        <div className="flex flex-col gap-1.5 rounded-b-xl px-3 py-2.5">
          {/* Badge row */}
          {badge && <div className="flex items-center gap-1.5">{badge}</div>}

          {/* Detail text */}
          {detail && (
            <p className="truncate text-[11px] text-slate-400">{detail}</p>
          )}

          {/* Description */}
          {data.description && (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">
              {data.description}
            </p>
          )}
        </div>
      )}

      {/* ── Source handle (right, single) ─────────────────── */}
      {hasSource && extraSources.length === 0 && (
        <Dot type="source" topPct={50} />
      )}

      {/* ── Extra source handles (Decision node Yes/No) ───── */}
      {extraSources.map(({ id: hid, topPct, label }) => (
        <React.Fragment key={hid}>
          <Dot type="source" id={hid} topPct={topPct} />
          {/* Label sits to the left of the handle, inside the card */}
          <span
            className="pointer-events-none absolute right-4 z-10 -translate-y-1/2 text-[9px] font-medium text-slate-400"
            style={{ top: `${topPct}%` }}
          >
            {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

export default memo(BaseNode)
