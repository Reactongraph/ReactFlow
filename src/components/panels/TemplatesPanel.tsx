import React, { useState } from 'react'
import {
  X, BookMarked, Trash2, GripVertical, Search,
  Zap, Play, ArrowRight, Layers,
} from 'lucide-react'
import { useFlowStore } from '../../store'
import { getNode } from '../../nodes'

interface Props { onClose: () => void }

// ── Category accent colors ─────────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  Communication: 'bg-sky-50 border-sky-200 text-sky-700',
  Automation:    'bg-indigo-50 border-indigo-200 text-indigo-700',
  Data:          'bg-teal-50 border-teal-200 text-teal-700',
  AI:            'bg-purple-50 border-purple-200 text-purple-700',
}

const CATEGORY_DOT: Record<string, string> = {
  Communication: 'bg-sky-400',
  Automation:    'bg-indigo-400',
  Data:          'bg-teal-400',
  AI:            'bg-purple-400',
}

const TemplatesPanel: React.FC<Props> = ({ onClose }) => {
  const { workflowTemplates, loadWorkflowTemplate, templates, createFromTemplate } = useFlowStore()
  const [search, setSearch] = useState('')
  const [tab, setTab]       = useState<'workflow' | 'node'>('workflow')

  const query = search.toLowerCase().trim()

  // Filter workflow templates
  const filteredWorkflows = workflowTemplates.filter(t =>
    !query ||
    t.name.toLowerCase().includes(query) ||
    t.description.toLowerCase().includes(query) ||
    t.category.toLowerCase().includes(query),
  )

  // Filter single-node templates
  const filteredNodes = Object.entries(templates).filter(([, t]) =>
    !query || t.data.label.toLowerCase().includes(query),
  )

  const deleteNodeTemplate = (id: string) => {
    useFlowStore.setState(s => {
      const next = { ...s.templates }
      delete next[id]
      return { templates: next }
    })
  }

  const handleLoadWorkflow = (id: string) => {
    loadWorkflowTemplate(id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Layers size={15} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-800">Templates</h2>
            <p className="text-xs text-slate-400">
              {workflowTemplates.length} workflow templates · {Object.keys(templates).length} saved node templates
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-2.5">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setTab('workflow')}
              className={`rounded-md px-3 py-1 transition-colors ${tab === 'workflow' ? 'bg-white text-slateigo-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Workflows
            </button>
            <button
              onClick={() => setTab('node')}
              className={`rounded-md px-3 py-1 transition-colors ${tab === 'node' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Node Templates
            </button>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <Search size={12} className="shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Workflow Templates tab ─────────────────────── */}
          {tab === 'workflow' && (
            <div className="p-4 space-y-3">
              {filteredWorkflows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <Layers size={28} className="text-slate-200" />
                  <p className="text-sm text-slate-400">No workflows match "{search}"</p>
                </div>
              ) : filteredWorkflows.map(tpl => (
                <div
                  key={tpl.id}
                  className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Category dot */}
                    <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_DOT[tpl.category] ?? 'bg-slate-300'}`} />

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{tpl.name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLOR[tpl.category] ?? 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                          {tpl.category}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{tpl.description}</p>

                      {/* Node flow preview */}
                      <div className="mt-3 flex items-center gap-1 flex-wrap">
                        {tpl.nodes.map((node, i) => {
                          const def = getNode(node.type)
                          return (
                            <React.Fragment key={node.id}>
                              <div className="flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5">
                                <span className={`flex h-4 w-4 items-center justify-center rounded text-white text-[9px] bg-gradient-to-br ${def?.color ?? 'from-slate-400 to-slate-500'}`}>
                                  {def?.icon}
                                </span>
                                <span className="text-[10px] font-medium text-slate-600">{node.data.label}</span>
                              </div>
                              {i < tpl.nodes.length - 1 && (
                                <ArrowRight size={10} className="text-slate-300 shrink-0" />
                              )}
                            </React.Fragment>
                          )
                        })}
                      </div>

                      {/* Stats + Load button */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Zap size={10} /> {tpl.nodes.length} nodes
                          </span>
                          <span>{tpl.edges.length} connections</span>
                        </div>
                        <button
                          onClick={() => handleLoadWorkflow(tpl.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                        >
                          <Play size={11} /> Load Workflow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Node Templates tab ────────────────────────── */}
          {tab === 'node' && (
            <div className="divide-y divide-slate-100">
              {filteredNodes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <BookMarked size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {search ? 'No templates match' : 'No node templates saved yet'}
                  </p>
                  {!search && (
                    <p className="max-w-[240px] text-center text-xs text-slate-400">
                      Select any node on the canvas → click <strong>Save Template</strong> in the Property Panel
                    </p>
                  )}
                </div>
              ) : filteredNodes.map(([id, node]) => {
                const def = getNode(node.type)
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: id, isTemplate: true }))
                    }}
                    className="group flex cursor-grab items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 active:cursor-grabbing"
                  >
                    <GripVertical size={13} className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white bg-gradient-to-br ${def?.color ?? 'from-slate-400 to-slate-500'}`}>
                      {def?.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700">{node.data.label}</p>
                      <p className="text-[11px] text-slate-400">
                        {def?.name ?? node.type}
                        {def?.category && <span className="ml-1.5 text-slate-300">· {def.category}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => {
                          createFromTemplate(id, { x: 200 + Math.random() * 200, y: 200 + Math.random() * 100 })
                          onClose()
                        }}
                        className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-indigo-100"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => deleteNodeTemplate(id)}
                        className="rounded-md p-1 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-2.5">
          <p className="text-center text-[10px] text-slate-400">
            {tab === 'workflow'
              ? 'Loading a workflow replaces the current canvas — use Ctrl+Z to undo'
              : 'Drag a node template onto the canvas · or click Add to place it'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TemplatesPanel
