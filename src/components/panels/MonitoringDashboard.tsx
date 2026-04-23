import React, { useMemo } from 'react'
import {
  Activity, CheckCircle2, XCircle, Clock,
  TrendingUp, Zap, X, Trash2, BarChart2,
} from 'lucide-react'
import { useFlowStore } from '../../store'

// ── Stat card ──────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  bg: string
  iconBg: string
}> = ({ label, value, sub, icon, bg, iconBg }) => (
  <div className={`flex items-start gap-3 rounded-2xl p-4 ${bg}`}>
    <div className={`rounded-xl p-2 ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] opacity-50">{sub}</p>}
    </div>
  </div>
)

// ── Main component ─────────────────────────────────────────────

export const MonitoringDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const runHistory   = useFlowStore(s => s.runHistory)
  const clearHistory = useFlowStore(s => s.clearRunHistory)

  // Derive all metrics from local run history
  const metrics = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTs = todayStart.getTime()

    const todayRuns       = runHistory.filter(r => r.startedAt >= todayTs)
    const completedToday  = todayRuns.filter(r => r.status === 'completed').length
    const failedToday     = todayRuns.filter(r => r.status === 'failed').length
    const totalRuns       = runHistory.length
    const totalCompleted  = runHistory.filter(r => r.status === 'completed').length
    const totalFailed     = runHistory.filter(r => r.status === 'failed').length
    const successRate     = totalRuns > 0 ? Math.round((totalCompleted / totalRuns) * 100) : 0

    const avgDurationMs = totalRuns > 0
      ? Math.round(runHistory.reduce((s, r) => s + r.durationMs, 0) / totalRuns)
      : 0

    // Top failing nodes — aggregate error logs across all runs
    const failCounts = new Map<string, number>()
    for (const run of runHistory) {
      for (const log of run.logs) {
        if (log.type === 'error' && log.nodeLabel && log.nodeLabel !== 'Executor') {
          failCounts.set(log.nodeLabel, (failCounts.get(log.nodeLabel) ?? 0) + 1)
        }
      }
    }
    const topFailingNodes = Array.from(failCounts.entries())
      .map(([nodeLabel, failCount]) => ({ nodeLabel, failCount }))
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 5)

    // Last 7 runs for the mini sparkline
    const recent = runHistory.slice(0, 7).reverse()

    return {
      totalRuns, completedToday, failedToday, totalCompleted, totalFailed,
      successRate, avgDurationMs, topFailingNodes, recent,
    }
  }, [runHistory])

  const avgSec = metrics.avgDurationMs > 0
    ? (metrics.avgDurationMs / 1000).toFixed(1) + 's'
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Monitoring Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {runHistory.length} run{runHistory.length !== 1 ? 's' : ''} recorded
            </span>
            {runHistory.length > 0 && (
              <button
                onClick={clearHistory}
                title="Clear all history"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {runHistory.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <BarChart2 size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No data yet</p>
              <p className="text-xs text-slate-400">Run the workflow to start seeing metrics</p>
            </div>
          ) : (
            <>
              {/* Stat grid */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                <StatCard
                  label="Total Runs"
                  value={metrics.totalRuns}
                  icon={<TrendingUp size={16} className="text-blue-600" />}
                  bg="bg-blue-50 text-blue-900"
                  iconBg="bg-blue-100"
                />
                <StatCard
                  label="Success Rate"
                  value={`${metrics.successRate}%`}
                  sub={`${metrics.totalCompleted} completed · ${metrics.totalFailed} failed`}
                  icon={<Zap size={16} className="text-indigo-600" />}
                  bg="bg-indigo-50 text-indigo-900"
                  iconBg="bg-indigo-100"
                />
                <StatCard
                  label="Completed Today"
                  value={metrics.completedToday}
                  icon={<CheckCircle2 size={16} className="text-emerald-600" />}
                  bg="bg-emerald-50 text-emerald-900"
                  iconBg="bg-emerald-100"
                />
                <StatCard
                  label="Failed Today"
                  value={metrics.failedToday}
                  icon={<XCircle size={16} className="text-red-600" />}
                  bg="bg-red-50 text-red-900"
                  iconBg="bg-red-100"
                />
              </div>

              {/* Avg duration */}
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="rounded-xl bg-slate-200 p-2">
                  <Clock size={16} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Avg Execution Time</p>
                  <p className="text-2xl font-bold text-slate-900">{avgSec}</p>
                </div>
              </div>

              {/* Recent runs mini-chart */}
              {metrics.recent.length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recent Runs
                  </h3>
                  <div className="flex items-end gap-1.5 h-14">
                    {metrics.recent.map((run) => {
                      const maxMs = Math.max(...metrics.recent.map(r => r.durationMs), 1)
                      const heightPct = Math.max(10, Math.round((run.durationMs / maxMs) * 100))
                      return (
                        <div
                          key={run.id}
                          title={`${run.workflowName} · ${(run.durationMs / 1000).toFixed(1)}s · ${run.status}`}
                          className="group relative flex-1 cursor-default"
                          style={{ height: `${heightPct}%` }}
                        >
                          <div className={[
                            'h-full w-full rounded-t-sm transition-opacity group-hover:opacity-80',
                            run.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400',
                          ].join(' ')} />
                          {/* Tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {(run.durationMs / 1000).toFixed(1)}s
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                    <span>oldest</span>
                    <span>latest</span>
                  </div>
                </div>
              )}

              {/* Top failing nodes */}
              {metrics.topFailingNodes.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Top Failing Nodes
                  </h3>
                  <div className="space-y-2">
                    {metrics.topFailingNodes.map((node, idx) => {
                      const max = metrics.topFailingNodes[0].failCount
                      const pct = Math.round((node.failCount / max) * 100)
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="w-4 shrink-0 text-right text-xs text-slate-400">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="truncate text-xs font-medium text-slate-700">
                                {node.nodeLabel}
                              </span>
                              <span className="ml-2 shrink-0 text-xs font-semibold text-red-500">
                                {node.failCount}×
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-red-400 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
