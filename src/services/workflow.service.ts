import api from './api'
import { CustomNode } from '../types'
import { Edge } from 'reactflow'

// ── Types ────────────────────────────────────────────────────────

export interface ApiWorkflow {
  id:             string
  name:           string
  description:    string | null
  nodes:          CustomNode[]
  edges:          Edge[]
  settings:       Record<string, unknown>
  tags:           string[]
  isActive:       boolean
  totalRuns:      number
  lastRunAt:      string | null
  lastRunStatus:  string | null
  createdAt:      string
  updatedAt:      string
}

export interface ApiWorkflowRun {
  id:          string
  workflowId:  string
  status:      string
  triggerType: string
  startedAt:   string | null
  completedAt: string | null
  durationMs:  number | null
  nodeCount:   number
  errorMessage: string | null
  nodeResults: Record<string, unknown>
  createdAt:   string
}

export interface ApiExecutionLog {
  id:         string
  runId:      string
  nodeId:     string | null
  nodeLabel:  string | null
  level:      string
  message:    string
  data:       unknown
  durationMs: number | null
  createdAt:  string
}

export interface ApiWorkflowVersion {
  id:         string
  workflowId: string
  name:       string | null
  description: string | null
  nodeCount:  number
  edgeCount:  number
  createdAt:  string
}

// ── Workflow CRUD ─────────────────────────────────────────────────

export const workflowService = {
  async list(search?: string): Promise<{ data: ApiWorkflow[]; total: number }> {
    const { data } = await api.get<{ data: ApiWorkflow[]; total: number }>('/workflows', {
      params: search ? { search } : undefined,
    })
    return data
  },

  async get(id: string): Promise<ApiWorkflow> {
    const { data } = await api.get<ApiWorkflow>(`/workflows/${id}`)
    return data
  },

  async create(payload: {
    name: string
    nodes?: CustomNode[]
    edges?: Edge[]
    settings?: Record<string, unknown>
  }): Promise<ApiWorkflow> {
    const { data } = await api.post<ApiWorkflow>('/workflows', payload)
    return data
  },

  async save(id: string, payload: {
    name?: string
    nodes: CustomNode[]
    edges: Edge[]
    settings?: Record<string, unknown>
  }): Promise<ApiWorkflow> {
    const { data } = await api.put<ApiWorkflow>(`/workflows/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`)
  },

  // ── Versions ───────────────────────────────────────────────────

  async listVersions(workflowId: string): Promise<ApiWorkflowVersion[]> {
    const { data } = await api.get<ApiWorkflowVersion[]>(`/workflows/${workflowId}/versions`)
    return data
  },

  async saveVersion(workflowId: string, name?: string): Promise<ApiWorkflowVersion> {
    const { data } = await api.post<ApiWorkflowVersion>(`/workflows/${workflowId}/versions`, { name })
    return data
  },

  async restoreVersion(workflowId: string, versionId: string): Promise<ApiWorkflow> {
    const { data } = await api.post<ApiWorkflow>(`/workflows/${workflowId}/versions/${versionId}/restore`)
    return data
  },

  // ── Execution ──────────────────────────────────────────────────

  async triggerRun(workflowId: string, inputData?: Record<string, unknown>): Promise<ApiWorkflowRun> {
    const { data } = await api.post<ApiWorkflowRun>(`/workflows/${workflowId}/runs`, {
      data: inputData,
    })
    return data
  },

  async listRuns(workflowId: string, page = 1): Promise<{ data: ApiWorkflowRun[]; total: number }> {
    const { data } = await api.get<{ data: ApiWorkflowRun[]; total: number }>(
      `/workflows/${workflowId}/runs`,
      { params: { page } },
    )
    return data
  },

  async getRun(workflowId: string, runId: string): Promise<ApiWorkflowRun> {
    const { data } = await api.get<ApiWorkflowRun>(`/workflows/${workflowId}/runs/${runId}`)
    return data
  },

  async getLogs(workflowId: string, runId: string): Promise<ApiExecutionLog[]> {
    const { data } = await api.get<ApiExecutionLog[]>(`/workflows/${workflowId}/runs/${runId}/logs`)
    return data
  },

  async cancelRun(workflowId: string, runId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}/runs/${runId}`)
  },
}
