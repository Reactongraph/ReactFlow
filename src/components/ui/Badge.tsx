import React from 'react'
import { NodeStatus } from '../../types'

interface StatusBadgeProps {
  status: NodeStatus
}

const statusConfig: Record<NodeStatus, { dot: string; label: string }> = {
  idle:    { dot: 'bg-slate-400',   label: 'Idle' },
  running: { dot: 'bg-blue-400 animate-pulse', label: 'Running' },
  success: { dot: 'bg-emerald-400', label: 'Success' },
  error:   { dot: 'bg-red-400',     label: 'Error' },
  warning: { dot: 'bg-amber-400',   label: 'Warning' },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status]
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
      <span className="text-xs text-white/70">{cfg.label}</span>
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  color?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'bg-slate-100 text-slate-600' }) => (
  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
    {children}
  </span>
)
