import React, { useState } from 'react'
import {
  Search, ArrowDownToLine, Globe, Shuffle, Cpu,
  GitFork, Sparkles, ArrowUpFromLine, BookTemplate,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { useFlowStore } from '../store'
import { NodeCategoryDef, NodeType } from '../types'

const CATEGORIES: NodeCategoryDef[] = [
  {
    category: 'Triggers',
    nodes: [{ type: 'input', label: 'Input', description: 'Data source / trigger', color: 'text-blue-500' }],
  },
  {
    category: 'Processing',
    nodes: [
      { type: 'api',        label: 'API Call',   description: 'HTTP request',           color: 'text-amber-500' },
      { type: 'transform',  label: 'Transform',  description: 'Map, filter, aggregate', color: 'text-cyan-500' },
      { type: 'processing', label: 'Processing', description: 'Custom script',          color: 'text-violet-500' },
    ],
  },
  {
    category: 'Logic',
    nodes: [{ type: 'decision', label: 'Decision', description: 'Conditional branching', color: 'text-pink-500' }],
  },
  {
    category: 'AI',
    nodes: [{ type: 'ai', label: 'AI Node', description: 'LLM / ML inference', color: 'text-purple-600' }],
  },
  {
    category: 'Outputs',
    nodes: [{ type: 'output', label: 'Output', description: 'Result destination', color: 'text-emerald-500' }],
  },
]

const NODE_ICONS: Record<NodeType, React.ReactNode> = {
  input:      <ArrowDownToLine size={14} />,
  output:     <ArrowUpFromLine size={14} />,
  processing: <Cpu size={14} />,
  api:        <Globe size={14} />,
  transform:  <Shuffle size={14} />,
  decision:   <GitFork size={14} />,
  ai:         <Sparkles size={14} />,
}

const NodeLibrary: React.FC = () => {
  const { templates } = useFlowStore()
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Triggers: true, Processing: true, Logic: true, AI: true, Outputs: true, Templates: true })

  const toggle = (cat: string) => setExpanded(p => ({ ...p, [cat]: !p[cat] }))

  const handleDragStart = (e: React.DragEvent, type: string, isTemplate: boolean) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({ type, isTemplate }))
  }

  const query = search.toLowerCase()

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n =>
      n.label.toLowerCase().includes(query) ||
      n.description.toLowerCase().includes(query),
    ),
  })).filter(cat => cat.nodes.length > 0)

  const filteredTemplates = Object.entries(templates).filter(([, t]) =>
    t.data.label.toLowerCase().includes(query),
  )

  return (
    <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-3 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Node Library
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search nodes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredCategories.map(cat => (
          <div key={cat.category} className="mb-1">
            <button
              onClick={() => toggle(cat.category)}
              className="flex w-full items-center gap-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded[cat.category]
                ? <ChevronDown size={10} />
                : <ChevronRight size={10} />
              }
              {cat.category}
            </button>

            {expanded[cat.category] && cat.nodes.map(node => (
              <div
                key={node.type}
                draggable
                onDragStart={e => handleDragStart(e, node.type, false)}
                className="group mx-2 mb-0.5 flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-slate-200 hover:bg-slate-50 active:cursor-grabbing active:opacity-70"
              >
                <span className={`shrink-0 ${node.color}`}>
                  {NODE_ICONS[node.type as NodeType]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 leading-tight">{node.label}</p>
                  <p className="truncate text-[10px] text-slate-400">{node.description}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Templates section */}
        {filteredTemplates.length > 0 && (
          <div className="mb-1">
            <button
              onClick={() => toggle('Templates')}
              className="flex w-full items-center gap-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded['Templates']
                ? <ChevronDown size={10} />
                : <ChevronRight size={10} />
              }
              <BookTemplate size={10} />
              Templates
            </button>

            {expanded['Templates'] && filteredTemplates.map(([id, t]) => (
              <div
                key={id}
                draggable
                onDragStart={e => handleDragStart(e, id, true)}
                className="group mx-2 mb-0.5 flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-indigo-100 hover:bg-indigo-50 active:cursor-grabbing active:opacity-70"
              >
                <span className="shrink-0 text-indigo-500">
                  {NODE_ICONS[t.type as NodeType]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 leading-tight">{t.data.label}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{t.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCategories.length === 0 && filteredTemplates.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">No nodes match "{search}"</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-100 px-3 py-2">
        <p className="text-[10px] text-slate-400 text-center">Drag nodes onto the canvas</p>
      </div>
    </aside>
  )
}

export default NodeLibrary
