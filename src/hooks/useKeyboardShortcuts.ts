import { useEffect } from 'react'
import { useFlowStore } from '../store'

export const useKeyboardShortcuts = () => {
  const { undo, redo, copyNodes, pasteNodes, duplicateNode, deleteNode, selectedNodeId } = useFlowStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              event.preventDefault()
              redo()
            } else {
              event.preventDefault()
              undo()
            }
            break
          case 'c':
            event.preventDefault()
            copyNodes()
            break
          case 'v':
            event.preventDefault()
            pasteNodes()
            break
          case 'd':
            event.preventDefault()
            duplicateNode()
            break
        }
      } else if (event.key === 'Delete' && selectedNodeId) {
        event.preventDefault()
        deleteNode(selectedNodeId)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copyNodes, pasteNodes, duplicateNode, deleteNode, selectedNodeId])
}