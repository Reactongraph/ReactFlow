import { useEffect } from 'react'
import { useFlowStore } from '../store'

export const useKeyboardShortcuts = (onOpenCommandPalette: () => void) => {
  const {
    undo, redo,
    copyNodes, pasteNodes, duplicateNode,
    deleteNode, selectedNodeId,
    validateWorkflow, autoLayout,
    execution, startExecution, pauseExecution, resumeExecution, stopExecution, stepExecution,
  } = useFlowStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in a form field
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault()
            onOpenCommandPalette()
            break
          case 'z':
            e.preventDefault()
            e.shiftKey ? redo() : undo()
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'c':
            e.preventDefault()
            copyNodes()
            break
          case 'v':
            e.preventDefault()
            pasteNodes()
            break
          case 'd':
            e.preventDefault()
            duplicateNode()
            break
          case 'l':
            e.preventDefault()
            autoLayout('LR')
            break
        }
        return
      }

      switch (e.key) {
        case 'F5':
          e.preventDefault()
          if (execution.status === 'paused') resumeExecution()
          else if (execution.status === 'idle' || execution.status === 'completed' || execution.status === 'failed') startExecution()
          break
        case 'F6':
          e.preventDefault()
          pauseExecution()
          break
        case 'F8':
          e.preventDefault()
          stopExecution()
          break
        case 'F10':
          e.preventDefault()
          stepExecution()
          break
        case 'Delete':
        case 'Backspace':
          if (selectedNodeId) {
            e.preventDefault()
            deleteNode(selectedNodeId)
          }
          break
        case 'Escape':
          useFlowStore.getState().setSelectedNode(null)
          break
        case 'Enter':
          e.preventDefault()
          validateWorkflow()
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [
    undo, redo, copyNodes, pasteNodes, duplicateNode, deleteNode, selectedNodeId,
    validateWorkflow, autoLayout, onOpenCommandPalette,
    execution.status, startExecution, pauseExecution, resumeExecution, stopExecution, stepExecution,
  ])
}
