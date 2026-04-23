// ── Trigger self-registration of all node plugins ─────────────
import './lib/legacy'
import './lib/triggers'
import './lib/api'
import './lib/ai'
import './lib/logic'
import './lib/transform'
import './lib/database'
import './lib/communication'
import './lib/files'
import './lib/utilities'
import './lib/debug'

// ── Registry exports ───────────────────────────────────────────
export { registerNode, getNode, getAllNodes, getNodesByCategory } from './registry'
export type { NodeDefinition, NodeCategory, FieldSchema, FieldType, PortSchema } from './registry/types'

// ── Build nodeTypes map for React Flow ────────────────────────
import React from 'react'
import { getAllNodes } from './registry'
import GenericNode from './registry/GenericNode'

function buildFullNodeTypesMap(): Record<string, React.FC<any>> {
  const map: Record<string, React.FC<any>> = {}
  for (const def of getAllNodes()) {
    map[def.type] = def.component ?? GenericNode
  }
  return map
}

// ── Legacy node components (backward compatibility) ────────────
export { default as InputNode }      from './InputNode'
export { default as OutputNode }     from './OutputNode'
export { default as ProcessingNode } from './ProcessingNode'
export { default as ApiNode }        from './ApiNode'
export { default as TransformNode }  from './TransformNode'
export { default as DecisionNode }   from './DecisionNode'
export { default as AiNode }         from './AiNode'

export const nodeTypes = buildFullNodeTypesMap()
