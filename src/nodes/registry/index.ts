import { NodeDefinition, NodeCategory } from './types'

const _registry = new Map<string, NodeDefinition>()

export function registerNode(def: NodeDefinition): void {
  if (_registry.has(def.type)) {
    console.warn(`[NodeRegistry] Overwriting existing node type: "${def.type}"`)
  }
  _registry.set(def.type, def)
}

export function getNode(type: string): NodeDefinition | undefined {
  return _registry.get(type)
}

export function getAllNodes(): NodeDefinition[] {
  return Array.from(_registry.values())
}

export function getNodesByCategory(): Map<NodeCategory, NodeDefinition[]> {
  const map = new Map<NodeCategory, NodeDefinition[]>()
  for (const def of _registry.values()) {
    const list = map.get(def.category) ?? []
    list.push(def)
    map.set(def.category, list)
  }
  return map
}

/** Build the nodeTypes map React Flow needs: { [type]: Component } */
export function buildNodeTypesMap(): Record<string, React.FC<any>> {
  const result: Record<string, React.FC<any>> = {}
  for (const [type, def] of _registry.entries()) {
    if (def.component) result[type] = def.component
  }
  return result
}

export { _registry as registry }
