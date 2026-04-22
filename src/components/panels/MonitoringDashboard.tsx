import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity, CheckCircle2, XCircle, Clock, TrendingUp,
  AlertTriangle, RefreshCw, X,
} from 'lucide-react'
import { monitoringService, PlatformMetrics } from '../../services/monitoring.service'

const StatCard: React.FC<{
  label:    string
  value:    string | number
  sub?:     string
  icon:     React.ReactNode
  color:    string
}> = ({ label, value, sub, icon, color }) => (
  <div className={`rounded-2xl p-4 ${color} flex items-start gap-3`}>
    <div className="p-2 rounded-xl bg-white/50">{icon}</div>
    <div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export const MonitoringDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setMetrics(await monitoringService.getMetrics())
      setLastRefresh(new Date())
    } catch {
      setError('Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30_000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const avgSec = metrics ? (metrics.avgDurationMs / 1000).toFixed(1) : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Monitoring Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-4">
              <AlertTriangle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          ) : loading && !metrics ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw size={20} className="text-slate-400 animate-spin" />
            </div>
          ) : metrics ? (
            <>
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard
                  label="Total Runs"
                  value={metrics.totalRuns.toLocaleString()}
                  icon={<TrendingUp size={16} className="text-blue-600" />}
                  color="bg-blue-50 text-blue-900"
                />
                <StatCard
                  label="Running Now"
                  value={metrics.runningNow}
                  icon={<Activity size={16} className="text-indigo-600" />}
                  color="bg-indigo-50 text-indigo-900"
                />
                <StatCard
                  label="Completed Today"
                  value={metrics.completedToday}
                  icon={<CheckCircle2 size={16} className="text-emerald-600" />}
                  color="bg-emerald-50 text-emerald-900"
                />
                <StatCard
                  label="Failed Today"
                  value={metrics.failedToday}
                  icon={<XCircle size={16} className="text-red-600" />}
                  color="bg-red-50 text-red-900"
                />
              </div>

              {/* Avg duration */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <Clock size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Average Execution Time</p>
                  <p className="text-2xl font-bold text-slate-900">{avgSec}s</p>
                </div>
              </div>

              {/* Top failing nodes */}
              {metrics.topFailingNodes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Failing Nodes</h3>
                  <div className="space-y-2">
                    {metrics.topFailingNodes.map((node, i) => {
                      const max = metrics.topFailingNodes[0].failCount
                      const pct = Math.round((node.failCount / max) * 100)
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-700 truncate">
                                {node.nodeLabel || 'Unknown node'}
                              </span>
                              <span className="text-xs text-red-500 font-medium ml-2 shrink-0">
                                {node.failCount} errors
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-400 rounded-full transition-all"
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
          ) : null}
        </div>
      </div>
    </div>
  )
}
