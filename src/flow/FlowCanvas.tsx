import React, { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  ReactFlowInstance,
  MarkerType,
  ConnectionLineType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import { nodeTypes } from '../nodes'
import { NodeType } from '../types'
import CanvasContextMenu from './CanvasContextMenu'

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
}

const proOptions = { hideAttribution: true }

interface ContextMenuState {
  x: number
  y: number
  flowX: number
  flowY: number
}

const FlowCanvas: React.FC = () => {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    setSelectedNode, addNode, createFromTemplate,
    pasteNodes, autoLayout,
  } = useFlowStore()

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  /* ── Node click / pane click ───────────────────────────── */
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setContextMenu(null)
  }, [setSelectedNode])

  /* ── Drag & drop from node library ─────────────────────── */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!rfInstance.current) return

    const raw  = e.dataTransfer.getData('application/json')
    if (!raw) return
    const data = JSON.parse(raw) as { type: string; isTemplate: boolean }

    const bounds   = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const position = rfInstance.current.project({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    })

    if (data.isTemplate) {
      createFromTemplate(data.type, position)
    } else {
      addNode(data.type as NodeType, position)
    }
  }, [addNode, createFromTemplate])

  /* ── Right-click context menu ───────────────────────────── */
  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (!rfInstance.current) return
    const bounds  = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const flowPos = rfInstance.current.project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top })
    setContextMenu({ x: e.clientX, y: e.clientY, flowX: flowPos.x, flowY: flowPos.y })
  }, [])

  const handleContextAddNode = useCallback((type: NodeType) => {
    if (!contextMenu) return
    addNode(type, { x: contextMenu.flowX, y: contextMenu.flowY })
  }, [addNode, contextMenu])

  const handleFitView = useCallback(() => {
    rfInstance.current?.fitView({ padding: 0.15, duration: 500 })
  }, [])

  /* ── MiniMap node color ─────────────────────────────────── */
  const nodeColor = useCallback((node: Node) => {
    const colorMap: Record<string, string> = {
      input: '#3b82f6', output: '#10b981', processing: '#8b5cf6',
      api: '#f59e0b', transform: '#06b6d4', decision: '#ec4899', ai: '#7c3aed',
    }
    return colorMap[node.type ?? ''] ?? '#94a3b8'
  }, [])

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={(inst) => { rfInstance.current = inst }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        proOptions={proOptions}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        className="bg-slate-50"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.2}
          color="#cbd5e1"
        />
        <Controls
          showInteractive={false}
          className="!border-slate-200 !bg-white !shadow-md !rounded-xl overflow-hidden"
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(248,250,252,0.7)"
          className="!border-slate-200 !rounded-xl !shadow-md"
          zoomable
          pannable
        />
      </ReactFlow>

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAddNode={handleContextAddNode}
          onPaste={() => pasteNodes({ x: contextMenu.flowX, y: contextMenu.flowY })}
          onAutoLayout={autoLayout}
          onFitView={handleFitView}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default FlowCanvas
