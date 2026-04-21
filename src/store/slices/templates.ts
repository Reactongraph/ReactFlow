import { StateCreator } from 'zustand'
import { FlowState, CustomNode } from '../../types'

export const createTemplateSlice: StateCreator<FlowState, [], [], Pick<FlowState, 'templates' | 'saveTemplate' | 'createFromTemplate'>> = (set, get) => ({
  templates: {} as Record<string, CustomNode>,

  saveTemplate: (node: CustomNode) => {
    const templateId = `template-${node.type}-${Date.now()}`
    set((state) => ({
      templates: {
        ...state.templates,
        [templateId]: { ...node, id: templateId },
      },
    }))
  },

  createFromTemplate: (templateId: string, position: { x: number; y: number }) => {
    const currentState = get()
    const template = (currentState.templates as Record<string, CustomNode>)[templateId]
    if (!template) return
    const newNode: CustomNode = {
      ...template,
      id: `${template.type}-${Date.now()}`,
      position,
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }))
    currentState.addToHistory({ nodes: currentState.nodes, edges: currentState.edges })
  },
})