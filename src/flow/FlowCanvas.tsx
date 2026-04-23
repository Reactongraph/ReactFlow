import React, { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  ReactFlowInstance,
  MarkerType,
  ConnectionLineType,
  Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import { nodeTypes, getNode } from '../nodes'
import { NodeType } from '../types'
import CanvasContextMenu from './CanvasContextMenu'

const proOptions = { hideAttribution: true }

// ── Tailwind color → hex lookup (covers every color used in node definitions) ──
const TW: Record<string, Record<string, string>> = {
  blue:    { '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af' },
  indigo:  { '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca' },
  violet:  { '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9' },
  purple:  { '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce' },
  fuchsia: { '500': '#d946ef', '600': '#c026d3' },
  pink:    { '400': '#f472b6', '500': '#ec4899', '600': '#db2777' },
  rose:    { '500': '#f43f5e', '600': '#e11d48' },
  red:     { '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c' },
  orange:  { '500': '#f97316', '600': '#ea580c' },
  amber:   { '500': '#f59e0b', '600': '#d97706' },
  yellow:  { '500': '#eab308', '600': '#ca8a04' },
  lime:    { '500': '#84cc16', '600': '#65a30d' },
  green:   { '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534' },
  emerald: { '500': '#10b981', '600': '#059669' },
  teal:    { '500': '#14b8a6', '600': '#0d9488' },
  cyan:    { '500': '#06b6d4', '600': '#0891b2' },
  sky:     { '500': '#0ea5e9', '600': '#0284c7' },
  slate:   { '400': '#94a3b8', '500': '#64748b', '600': '#475569' },
}

function gradientToHex(color: string): string {
  // color is like 'from-blue-500 to-blue-600' — extract the from- value
  const m = color.match(/from-(\w+)-(\d+)/)
  if (m) return TW[m[1]]?.[m[2]] ?? '#94a3b8'
  return '#94a3b8'
}

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
    setRfInstance,
    execution,
  } = useFlowStore()

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  // ── Merge execution state into edges (active = animated indigo) ──
  const displayEdges: Edge[] = useMemo(() => {
    if (execution.activeEdges.size === 0) return edges
    return edges.map(edge =>
      execution.activeEdges.has(edge.id)
        ? {
            ...edge,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          }
        : edge,
    )
  }, [edges, execution.activeEdges])

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep' as const,
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  }), [])

  /* ── Init ──────────────────────────────────────────────── */
  const onInit = useCallback((inst: ReactFlowInstance) => {
    rfInstance.current = inst
    setRfInstance(inst)
  }, [setRfInstance])

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

    const raw = e.dataTransfer.getData('application/json')
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
    const def = getNode(node.type ?? '')
    if (def?.color) return gradientToHex(def.color)
    return '#94a3b8'
  }, [])

  /* ── Node double-click → toggle breakpoint ─────────────── */
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    useFlowStore.getState().toggleBreakpoint(node.id)
  }, [])

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={onInit}
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
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.2} color="#cbd5e1" />
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

      {/* Double-click hint */}
      {nodes.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-[10px] text-slate-400 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
          Double-click a node to toggle breakpoint
        </div>
      )}

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
