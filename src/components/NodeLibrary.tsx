import React, { useState, useMemo, useCallback } from 'react'
import {
  Search, ChevronDown,
  Zap, Globe, Sparkles, GitFork, Shuffle,
  Database, Mail, Upload, Clock, Bug,
  BookMarked, GripVertical, X,
} from 'lucide-react'
import { useFlowStore } from '../store'
import { getNodesByCategory } from '../nodes'
import type { NodeCategory, NodeDefinition } from '../nodes'

// ─────────────────────────────────────────────────────────────────────────────
// Category palette — icon, label color, header bg, badge bg, hover ring
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryStyle {
  icon: React.ReactNode
  /** Tailwind text color for the category label */
  labelColor: string
  /** Tailwind bg for the thin left accent bar */
  accentBar: string
  /** Tailwind bg + text for the node-count pill */
  pillBg: string
  pillText: string
  /** Tailwind bg + border used on NodeCard hover */
  cardHoverBg: string
  cardHoverBorder: string
  /** Tailwind bg + text for the icon chip on each NodeCard */
  chipBg: string
  chipText: string
  order: number
}

const CATEGORY_STYLES: Record<NodeCategory, CategoryStyle> = {
  'Triggers': {
    icon:            <Zap size={12} />,
    labelColor:      'text-blue-600',
    accentBar:       'bg-blue-500',
    pillBg:          'bg-blue-50',
    pillText:        'text-blue-600',
    cardHoverBg:     'hover:bg-blue-50/60',
    cardHoverBorder: 'hover:border-blue-200',
    chipBg:          'bg-blue-100',
    chipText:        'text-blue-600',
    order: 0,
  },
  'API & HTTP': {
    icon:            <Globe size={12} />,
    labelColor:      'text-amber-600',
    accentBar:       'bg-amber-500',
    pillBg:          'bg-amber-50',
    pillText:        'text-amber-600',
    cardHoverBg:     'hover:bg-amber-50/60',
    cardHoverBorder: 'hover:border-amber-200',
    chipBg:          'bg-amber-100',
    chipText:        'text-amber-600',
    order: 1,
  },
  'AI / LLM': {
    icon:            <Sparkles size={12} />,
    labelColor:      'text-purple-600',
    accentBar:       'bg-purple-500',
    pillBg:          'bg-purple-50',
    pillText:        'text-purple-600',
    cardHoverBg:     'hover:bg-purple-50/60',
    cardHoverBorder: 'hover:border-purple-200',
    chipBg:          'bg-purple-100',
    chipText:        'text-purple-600',
    order: 2,
  },
  'Logic & Control': {
    icon:            <GitFork size={12} />,
    labelColor:      'text-rose-600',
    accentBar:       'bg-rose-500',
    pillBg:          'bg-rose-50',
    pillText:        'text-rose-600',
    cardHoverBg:     'hover:bg-rose-50/60',
    cardHoverBorder: 'hover:border-rose-200',
    chipBg:          'bg-rose-100',
    chipText:        'text-rose-600',
    order: 3,
  },
  'Data Transform': {
    icon:            <Shuffle size={12} />,
    labelColor:      'text-cyan-600',
    accentBar:       'bg-cyan-500',
    pillBg:          'bg-cyan-50',
    pillText:        'text-cyan-600',
    cardHoverBg:     'hover:bg-cyan-50/60',
    cardHoverBorder: 'hover:border-cyan-200',
    chipBg:          'bg-cyan-100',
    chipText:        'text-cyan-600',
    order: 4,
  },
  'Database': {
    icon:            <Database size={12} />,
    labelColor:      'text-indigo-600',
    accentBar:       'bg-indigo-500',
    pillBg:          'bg-indigo-50',
    pillText:        'text-indigo-600',
    cardHoverBg:     'hover:bg-indigo-50/60',
    cardHoverBorder: 'hover:border-indigo-200',
    chipBg:          'bg-indigo-100',
    chipText:        'text-indigo-600',
    order: 5,
  },
  'Communication': {
    icon:            <Mail size={12} />,
    labelColor:      'text-sky-600',
    accentBar:       'bg-sky-500',
    pillBg:          'bg-sky-50',
    pillText:        'text-sky-600',
    cardHoverBg:     'hover:bg-sky-50/60',
    cardHoverBorder: 'hover:border-sky-200',
    chipBg:          'bg-sky-100',
    chipText:        'text-sky-600',
    order: 6,
  },
  'Files': {
    icon:            <Upload size={12} />,
    labelColor:      'text-violet-600',
    accentBar:       'bg-violet-500',
    pillBg:          'bg-violet-50',
    pillText:        'text-violet-600',
    cardHoverBg:     'hover:bg-violet-50/60',
    cardHoverBorder: 'hover:border-violet-200',
    chipBg:          'bg-violet-100',
    chipText:        'text-violet-600',
    order: 7,
  },
  'Utilities': {
    icon:            <Clock size={12} />,
    labelColor:      'text-teal-600',
    accentBar:       'bg-teal-500',
    pillBg:          'bg-teal-50',
    pillText:        'text-teal-600',
    cardHoverBg:     'hover:bg-teal-50/60',
    cardHoverBorder: 'hover:border-teal-200',
    chipBg:          'bg-teal-100',
    chipText:        'text-teal-600',
    order: 8,
  },
  'Debug': {
    icon:            <Bug size={12} />,
    labelColor:      'text-slate-500',
    accentBar:       'bg-slate-400',
    pillBg:          'bg-slate-100',
    pillText:        'text-slate-500',
    cardHoverBg:     'hover:bg-slate-50',
    cardHoverBorder: 'hover:border-slate-200',
    chipBg:          'bg-slate-100',
    chipText:        'text-slate-500',
    order: 9,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// NodeCard
// ─────────────────────────────────────────────────────────────────────────────

const NodeCard: React.FC<{
  def: NodeDefinition
  style: CategoryStyle
  onDragStart: (e: React.DragEvent) => void
}> = ({ def, style, onDragStart }) => (
  <div
    draggable
    onDragStart={onDragStart}
    title={def.description}
    className={[
      'group relative mx-2 mb-0.5 flex cursor-grab items-center gap-2.5',
      'rounded-lg border border-transparent px-2 py-2',
      'transition-all duration-100 select-none',
      'active:cursor-grabbing active:scale-[0.98] active:opacity-80',
      style.cardHoverBg,
      style.cardHoverBorder,
    ].join(' ')}
  >
    {/* Drag grip — visible on hover */}
    <GripVertical
      size={11}
      className="absolute left-0.5 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
    />

    {/* Icon chip */}
    <span className={[
      'shrink-0 flex h-7 w-7 items-center justify-center rounded-lg',
      'text-sm transition-transform group-hover:scale-105',
      style.chipBg,
      style.chipText,
    ].join(' ')}>
      {def.icon}
    </span>

    {/* Text */}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-slate-700 leading-tight">{def.name}</p>
      <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-400">{def.description}</p>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// CategorySection
// ─────────────────────────────────────────────────────────────────────────────

const CategorySection: React.FC<{
  category: NodeCategory
  nodes: NodeDefinition[]
  expanded: boolean
  onToggle: () => void
  onDragStart: (e: React.DragEvent, type: string) => void
}> = ({ category, nodes, expanded, onToggle, onDragStart }) => {
  const s = CATEGORY_STYLES[category]

  return (
    <div className="mb-0.5">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="group flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-slate-50"
      >
        {/* Colored accent bar */}
        <span className={`h-3.5 w-0.5 shrink-0 rounded-full ${s.accentBar}`} />

        {/* Category icon */}
        <span className={`shrink-0 ${s.labelColor}`}>{s.icon}</span>

        {/* Label */}
        <span className={`flex-1 text-left text-[11px] font-bold uppercase tracking-widest ${s.labelColor}`}>
          {category}
        </span>

        {/* Node count pill */}
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${s.pillBg} ${s.pillText}`}>
          {nodes.length}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={11}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {/* Node cards */}
      {expanded && (
        <div className="pb-1">
          {nodes.map(def => (
            <NodeCard
              key={def.type}
              def={def}
              style={s}
              onDragStart={e => onDragStart(e, def.type)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main NodeLibrary
// ─────────────────────────────────────────────────────────────────────────────

const NodeLibrary: React.FC = () => {
  const { templates } = useFlowStore()
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const categoryMap = useMemo(() => getNodesByCategory(), [])

  const sortedCategories = useMemo(() =>
    Array.from(categoryMap.entries()).sort(([a], [b]) => {
      const ao = CATEGORY_STYLES[a as NodeCategory]?.order ?? 99
      const bo = CATEGORY_STYLES[b as NodeCategory]?.order ?? 99
      return ao - bo
    }),
  [categoryMap])

  const query = search.toLowerCase().trim()

  const filteredCategories = useMemo(() =>
    sortedCategories.map(([cat, nodes]) => ({
      category: cat as NodeCategory,
      nodes: query
        ? nodes.filter(n =>
            n.name.toLowerCase().includes(query) ||
            n.description.toLowerCase().includes(query) ||
            n.type.toLowerCase().includes(query),
          )
        : nodes,
    })).filter(c => c.nodes.length > 0),
  [sortedCategories, query])

  const filteredTemplates = useMemo(() =>
    Object.entries(templates).filter(([, t]) =>
      !query || t.data.label.toLowerCase().includes(query),
    ),
  [templates, query])

  const isExpanded = useCallback((cat: string) =>
    expanded[cat] !== false, // default: open
  [expanded])

  const toggle = useCallback((cat: string) =>
    setExpanded(p => ({ ...p, [cat]: !isExpanded(cat) })),
  [isExpanded])

  const handleDragStart = useCallback((e: React.DragEvent, type: string, isTemplate = false) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({ type, isTemplate }))
  }, [])

  const totalNodes = useMemo(() =>
    Array.from(categoryMap.values()).reduce((s, n) => s + n.length, 0),
  [categoryMap])

  const matchCount = useMemo(() =>
    filteredCategories.reduce((s, c) => s + c.nodes.length, 0),
  [filteredCategories])

  return (
    <aside data-tour="node-library" className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="border-b border-slate-200 px-3 pb-3 pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Node Library
          </span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-500">
            {totalNodes}
          </span>
        </div>

        {/* Search */}
        <div className={[
          'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
          search
            ? 'border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-100'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300',
        ].join(' ')}>
          <Search size={12} className={`shrink-0 transition-colors ${search ? 'text-indigo-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search nodes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Search result count */}
        {query && (
          <p className="mt-1.5 text-[10px] text-slate-400">
            {matchCount} result{matchCount !== 1 ? 's' : ''} for <span className="font-semibold text-slate-600">"{query}"</span>
          </p>
        )}
      </div>

      {/* ── Node list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-1">

        {filteredCategories.map(({ category, nodes }) => (
          <CategorySection
            key={category}
            category={category}
            nodes={nodes}
            expanded={isExpanded(category)}
            onToggle={() => toggle(category)}
            onDragStart={handleDragStart}
          />
        ))}

        {/* ── Divider before templates ─────────────────────── */}
        {filteredTemplates.length > 0 && filteredCategories.length > 0 && (
          <div className="mx-3 my-2 border-t border-dashed border-slate-200" />
        )}

        {/* ── Templates section ────────────────────────────── */}
        {filteredTemplates.length > 0 && (
          <div className="mb-0.5">
            <button
              onClick={() => toggle('__templates__')}
              className="group flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-slate-50"
            >
              <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-indigo-400" />
              <BookMarked size={12} className="shrink-0 text-indigo-500" />
              <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-widest text-indigo-500">
                Templates
              </span>
              <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-500">
                {filteredTemplates.length}
              </span>
              <ChevronDown
                size={11}
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded('__templates__') ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>

            {isExpanded('__templates__') && (
              <div className="pb-1">
                {filteredTemplates.map(([id, t]) => (
                  <div
                    key={id}
                    draggable
                    onDragStart={e => handleDragStart(e, id, true)}
                    className="group relative mx-2 mb-0.5 flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 transition-all duration-100 select-none hover:border-indigo-200 hover:bg-indigo-50/60 active:cursor-grabbing active:scale-[0.98] active:opacity-80"
                  >
                    <GripVertical
                      size={11}
                      className="absolute left-0.5 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-105">
                      <BookMarked size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{t.data.label}</p>
                      <p className="mt-0.5 text-[10px] capitalize text-slate-400">{t.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────── */}
        {filteredCategories.length === 0 && filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Search size={16} className="text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-500">No results</p>
            <p className="mt-1 text-[11px] text-slate-400">
              No nodes match <span className="font-medium text-slate-600">"{search}"</span>
            </p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 rounded-md bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-3 py-2">
        <p className="text-center text-[10px] text-slate-400">
          Drag a node onto the canvas to add it
        </p>
      </div>
    </aside>
  )
}

export default NodeLibrary
