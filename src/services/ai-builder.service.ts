import { api } from './api'

export interface GeneratedWorkflow {
  name:  string
  nodes: Array<{
    id:       string
    type:     string
    label:    string
    position: { x: number; y: number }
    data:     Record<string, unknown>
  }>
  edges: Array<{
    id:     string
    source: string
    target: string
  }>
}

export const aiBuilderService = {
  generate: (prompt: string) =>
    api.post<GeneratedWorkflow>('/ai-builder/generate', { prompt }).then(r => r.data),
}
