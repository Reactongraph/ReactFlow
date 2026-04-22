import { api } from './api'

export interface PlatformMetrics {
  totalRuns:        number
  runningNow:       number
  completedToday:   number
  failedToday:      number
  avgDurationMs:    number
  topFailingNodes:  Array<{ nodeLabel: string; failCount: number }>
}

export const monitoringService = {
  getMetrics: () =>
    api.get<PlatformMetrics>('/monitoring/metrics').then(r => r.data),
}
