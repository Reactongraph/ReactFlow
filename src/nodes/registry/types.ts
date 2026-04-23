import React from 'react'
import { NodeProps } from 'reactflow'
import { NodeData } from '../../types'

// ── Field schema ───────────────────────────────────────────────

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'select'
  | 'boolean' | 'code' | 'password' | 'url' | 'json'

export interface SelectOption { value: string; label: string }

export interface FieldSchema {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  hint?: string
  options?: SelectOption[]
  defaultValue?: unknown
  required?: boolean
  rows?: number
}

// ── Port schema ────────────────────────────────────────────────

export type PortDataType = 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file'

export interface PortSchema {
  id: string
  label: string
  dataType: PortDataType
}

// ── Categories ─────────────────────────────────────────────────

export type NodeCategory =
  | 'Triggers'
  | 'API & HTTP'
  | 'AI / LLM'
  | 'Logic & Control'
  | 'Data Transform'
  | 'Database'
  | 'Communication'
  | 'Files'
  | 'Utilities'
  | 'Debug'

// ── Execution context ──────────────────────────────────────────

export interface ExecutionContext {
  nodeId: string
  nodeLabel: string
  signal: AbortSignal
}

export type NodeExecutorFn = (
  config: Record<string, unknown>,
  input: unknown,
  context: ExecutionContext,
) => Promise<unknown>

// ── Node definition — the plugin contract ─────────────────────

export interface NodeDefinition {
  type: string
  name: string
  description: string
  category: NodeCategory
  /** Tailwind gradient string e.g. 'from-blue-500 to-blue-600' */
  color: string
  icon: React.ReactNode
  inputs: PortSchema[]
  outputs: PortSchema[]
  fields: FieldSchema[]
  defaultConfig?: Record<string, unknown>
  executor: NodeExecutorFn
  /** Custom React Flow component — falls back to GenericNode */
  component?: React.FC<NodeProps<NodeData>>
}
