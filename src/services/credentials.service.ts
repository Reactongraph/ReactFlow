import { api } from './api'

export interface Credential {
  id:          string
  name:        string
  type:        string
  description: string | null
  createdAt:   string
  updatedAt:   string
}

export interface CreateCredentialPayload {
  name:         string
  type:         string
  data:         Record<string, unknown>
  description?: string
}

export const credentialsService = {
  list: () =>
    api.get<Credential[]>('/credentials').then(r => r.data),

  create: (payload: CreateCredentialPayload) =>
    api.post<Credential>('/credentials', payload).then(r => r.data),

  update: (id: string, data: Record<string, unknown>, name?: string, description?: string) =>
    api.put(`/credentials/${id}`, { data, name, description }),

  delete: (id: string) =>
    api.delete(`/credentials/${id}`),
}
