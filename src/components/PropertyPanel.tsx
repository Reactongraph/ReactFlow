import React, { useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Trash2, BookMarked, ChevronDown } from 'lucide-react'
import { useFlowStore } from '../store'
import { NodeData } from '../types'
import { Button } from './ui/Button'
import { getNode } from '../nodes'
import type { FieldSchema } from '../nodes'

// ── Shared primitives ──────────────────────────────────────────

const inputCls  = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300'
const selectCls = `${inputCls} cursor-pointer`
const textareaCls = `${inputCls} resize-none font-mono text-xs leading-relaxed`

const Field: React.FC<{ label: string; hint?: string; required?: boolean; children: React.ReactNode }> = ({
  label, hint, required, children,
}) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
      {label}{required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
)

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true,
}) => {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
      >
        {title}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
      </button>
      {open && <div className="space-y-3 px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

// ── Schema-driven field renderer ───────────────────────────────

const SchemaField: React.FC<{
  field: FieldSchema
  register: ReturnType<typeof useForm<NodeData>>['register']
}> = ({ field, register }) => {
  const regKey = `config.${field.key}` as any

  switch (field.type) {
    case 'select':
      return (
        <Field label={field.label} hint={field.hint} required={field.required}>
          <select {...register(regKey)} className={selectCls}>
            {field.options?.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      )
    case 'boolean':
      return (
        <Field label={field.label} hint={field.hint}>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" {...register(regKey)} className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
            <span className="text-xs text-slate-600">{field.hint ?? 'Enable'}</span>
          </label>
        </Field>
      )
    case 'number':
      return (
        <Field label={field.label} hint={field.hint} required={field.required}>
          <input
            type="number"
            {...register(regKey, { valueAsNumber: true })}
            placeholder={field.placeholder}
            className={inputCls}
          />
        </Field>
      )
    case 'password':
      return (
        <Field label={field.label} hint={field.hint} required={field.required}>
          <input
            type="password"
            {...register(regKey)}
            placeholder={field.placeholder}
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
      )
    case 'url':
      return (
        <Field label={field.label} hint={field.hint} required={field.required}>
          <input
            type="url"
            {...register(regKey)}
            placeholder={field.placeholder}
            className={inputCls}
          />
        </Field>
      )
    case 'textarea':
    case 'code':
    case 'json':
      return (
        <Field label={field.label} hint={field.hint} required={field.required}>
          <textarea
            rows={field.rows ?? (field.type === 'code' ? 6 : 3)}
            {...register(regKey)}
            placeholder={field.placeholder}
            className={textareaCls}
          />
        </Field>
      )
    default: // text
      return (
        <Field label={field.label} hint={field.hint} required={field.required}>
          <input
            type="text"
            {...register(regKey)}
            placeholder={field.placeholder}
            className={inputCls}
          />
        </Field>
      )
  }
}

// ── Legacy config forms for built-in node types ────────────────

const LEGACY_FIELDS: Record<string, FieldSchema[]> = {
  input: [
    { key: 'dataType', label: 'Data Type', type: 'select', options: [
      { value: 'json', label: 'JSON' }, { value: 'csv', label: 'CSV' },
      { value: 'text', label: 'Text' }, { value: 'number', label: 'Number' },
      { value: 'boolean', label: 'Boolean' },
    ]},
    { key: 'sampleData', label: 'Sample Data', type: 'json', rows: 3, placeholder: '{"key": "value"}', hint: 'Used for previewing and testing' },
  ],
  api: [
    { key: 'method', label: 'Method', type: 'select', options: [
      { value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' }, { value: 'DELETE', label: 'DELETE' }, { value: 'PATCH', label: 'PATCH' },
    ]},
    { key: 'url',     label: 'URL',     type: 'url',      placeholder: 'https://api.example.com/endpoint' },
    { key: 'headers', label: 'Headers', type: 'json',     rows: 2, placeholder: '{"Authorization": "Bearer ..."}' },
    { key: 'body',    label: 'Body',    type: 'json',     rows: 3, placeholder: '{"data": "value"}', hint: 'POST / PUT requests' },
    { key: 'timeout', label: 'Timeout (ms)', type: 'number', placeholder: '5000' },
  ],
  transform: [
    { key: 'transformType', label: 'Transform Type', type: 'select', options: [
      { value: 'map', label: 'Map' }, { value: 'filter', label: 'Filter' },
      { value: 'reduce', label: 'Reduce' }, { value: 'aggregate', label: 'Aggregate' }, { value: 'custom', label: 'Custom' },
    ]},
    { key: 'transformCode', label: 'Transform Code', type: 'code', rows: 5, placeholder: '(data) => data.map(item => ({ ...item }))', hint: 'JavaScript expression' },
  ],
  decision: [
    { key: 'condition',  label: 'Condition',         type: 'text', placeholder: 'data.value > 100', hint: 'Boolean expression' },
    { key: 'trueLabel',  label: 'True Branch Label',  type: 'text', placeholder: 'Yes' },
    { key: 'falseLabel', label: 'False Branch Label', type: 'text', placeholder: 'No'  },
  ],
  ai: [
    { key: 'model', label: 'Model', type: 'select', options: [
      { value: 'gpt-4', label: 'GPT-4' }, { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { value: 'claude-3-opus', label: 'Claude 3 Opus' }, { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    ]},
    { key: 'prompt',      label: 'System Prompt', type: 'textarea', rows: 4, placeholder: 'You are a helpful assistant...' },
    { key: 'maxTokens',   label: 'Max Tokens',    type: 'number',   placeholder: '1024' },
    { key: 'temperature', label: 'Temperature',   type: 'number',   placeholder: '0.7', hint: '0 = deterministic, 2 = creative' },
  ],
  output: [
    { key: 'format',      label: 'Output Format', type: 'select', options: [
      { value: 'json', label: 'JSON' }, { value: 'csv', label: 'CSV' },
      { value: 'html', label: 'HTML' }, { value: 'text', label: 'Text' },
    ]},
    { key: 'destination', label: 'Destination', type: 'text', placeholder: 'webhook URL or storage path' },
  ],
  processing: [
    { key: 'processingType', label: 'Processing Type', type: 'select', options: [
      { value: 'aggregate', label: 'Aggregate' }, { value: 'validate', label: 'Validate' },
      { value: 'enrich', label: 'Enrich' }, { value: 'normalize', label: 'Normalize' },
    ]},
    { key: 'script', label: 'Script', type: 'code', rows: 5, placeholder: '// JavaScript executed on each data item' },
  ],
}

const STATUS_OPTIONS = ['idle', 'running', 'success', 'error', 'warning'] as const

// ── Main panel ─────────────────────────────────────────────────

const PropertyPanel: React.FC = () => {
  const { selectedNodeId, nodes, updateNode, deleteNode, saveTemplate } = useFlowStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  const { register, reset, watch } = useForm<NodeData>({
    defaultValues: selectedNode?.data ?? {},
  })

  useEffect(() => {
    reset(selectedNode?.data ?? {})
  }, [selectedNodeId, reset, selectedNode?.data])

  const handleChange = useCallback(() => {
    if (!selectedNode) return
    updateNode(selectedNode.id, { data: watch() })
  }, [selectedNode, updateNode, watch])

  if (!selectedNode) {
    return (
      <aside className="flex w-72 flex-col items-center justify-center bg-white">
        <div className="text-center px-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ChevronDown size={20} className="text-slate-400 -rotate-90" />
          </div>
          <p className="text-sm font-medium text-slate-600">No node selected</p>
          <p className="mt-1 text-xs text-slate-400">Click a node on the canvas to inspect and configure it</p>
        </div>
      </aside>
    )
  }

  // Resolve fields: registry definition takes priority over legacy map
  const def = getNode(selectedNode.type)
  const configFields: FieldSchema[] = def?.fields ?? LEGACY_FIELDS[selectedNode.type] ?? []

  return (
    <aside className="flex w-72 flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Properties</p>
          <p className="truncate text-sm font-semibold text-slate-800 mt-0.5">{selectedNode.data.label}</p>
          {def && (
            <p className="truncate text-[10px] text-slate-400 mt-0.5">{def.category}</p>
          )}
        </div>
        <span className="ml-2 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
          {def?.name ?? selectedNode.type}
        </span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto" onChange={handleChange}>
        <Section title="General">
          <Field label="Label">
            <input {...register('label')} className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea rows={2} {...register('description')} className={textareaCls} placeholder="Describe what this node does…" />
          </Field>
          <Field label="Status">
            <select {...register('status')} className={selectCls}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>
        </Section>

        {configFields.length > 0 && (
          <Section title="Configuration">
            {configFields.map(field => (
              <SchemaField key={field.key} field={field} register={register} />
            ))}
          </Section>
        )}

        {/* Port info */}
        {def && (def.inputs.length > 0 || def.outputs.length > 0) && (
          <Section title="Ports" defaultOpen={false}>
            {def.inputs.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">Inputs</p>
                {def.inputs.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-[11px]">
                    <span className="font-medium text-slate-600">{p.label}</span>
                    <span className="text-slate-400">{p.dataType}</span>
                  </div>
                ))}
              </div>
            )}
            {def.outputs.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">Outputs</p>
                {def.outputs.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-[11px]">
                    <span className="font-medium text-slate-600">{p.label}</span>
                    <span className="text-slate-400">{p.dataType}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => saveTemplate(selectedNode)}>
          <BookMarked size={12} /> Save Template
        </Button>
        <Button variant="danger" size="sm" onClick={() => deleteNode(selectedNode.id)}>
          <Trash2 size={12} />
        </Button>
      </div>
    </aside>
  )
}

export default PropertyPanel
