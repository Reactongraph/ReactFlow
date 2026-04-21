import React, { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import { InputNode, ProcessingNode, OutputNode } from '../nodes'

const nodeTypes = {
  input: InputNode,
  processing: ProcessingNode,
  output: OutputNode,
}

const FlowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    addNode,
    createFromTemplate,
  } = useFlowStore()

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    const position = {
      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
      y: event.clientY - event.currentTarget.getBoundingClientRect().top,
    }

    if (data.isTemplate) {
      createFromTemplate(data.type, position)
    } else {
      addNode(data.type, position)
    }
  }, [addNode, createFromTemplate])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default FlowCanvas