import { StateCreator } from 'zustand'
import { FlowState, WorkflowVersion } from '../../types'

type VersionSliceKeys = 'versions' | 'saveVersion' | 'restoreVersion' | 'deleteVersion'

export const createVersionSlice: StateCreator<FlowState, [], [], Pick<FlowState, VersionSliceKeys>> = (set, get) => ({
  versions: [],

  saveVersion: (name?: string) => {
    const { nodes, edges, workflowName, versions } = get()
    const id = `v-${Date.now()}`
    const label = name?.trim() || `v${versions.length + 1} — ${new Date().toLocaleTimeString()}`
    const version: WorkflowVersion = {
      id,
      name: label,
      createdAt: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)) as typeof nodes,
      edges: JSON.parse(JSON.stringify(edges)) as typeof edges,
      workflowName,
    }
    set(s => ({ versions: [version, ...s.versions].slice(0, 20) })) // max 20 versions
  },

  restoreVersion: (id: string) => {
    const { versions, addToHistory, nodes, edges } = get()
    const version = versions.find(v => v.id === id)
    if (!version) return
    addToHistory({ nodes, edges }) // save current state before restoring
    set({
      nodes: version.nodes,
      edges: version.edges,
      workflowName: version.workflowName,
      selectedNodeId: null,
    })
  },

  deleteVersion: (id: string) => {
    set(s => ({ versions: s.versions.filter(v => v.id !== id) }))
  },
})
