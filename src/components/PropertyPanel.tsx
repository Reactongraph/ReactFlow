import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Trash2, BookMarked, ChevronDown } from 'lucide-react'
import { useFlowStore } from '../store'
import { NodeConfig, NodeData, NodeType } from '../types'
import { Button } from './ui/Button'

/* ── Shared field primitives ────────────────────────────────── */
const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
      {label}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
)

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300'
const selectCls = `${inputCls} cursor-pointer`
const textareaCls = `${inputCls} resize-none font-mono text-xs leading-relaxed`

/* ── Section accordion ──────────────────────────────────────── */
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

/* ── Type-specific config fields ────────────────────────────── */
type ConfigFormProps = {
  config: NodeConfig
  register: ReturnType<typeof useForm<NodeData>>['register']
}

const InputConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Data Type">
      <select {...register('config.dataType')} className={selectCls}>
        <option value="json">JSON</option>
        <option value="csv">CSV</option>
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
      </select>
    </Field>
    <Field label="Sample Data" hint="Used for previewing and testing">
      <textarea rows={3} {...register('config.sampleData')} className={textareaCls} placeholder='{"key": "value"}' />
    </Field>
  </>
)

const ApiConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Method">
      <select {...register('config.method')} className={selectCls}>
        {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
      </select>
    </Field>
    <Field label="URL">
      <input {...register('config.url')} className={inputCls} placeholder="https://api.example.com/endpoint" />
    </Field>
    <Field label="Headers" hint="JSON format: {'Key': 'Value'}">
      <textarea rows={2} {...register('config.headers')} className={textareaCls} placeholder='{"Authorization": "Bearer ..."}' />
    </Field>
    <Field label="Body" hint="For POST / PUT requests">
      <textarea rows={3} {...register('config.body')} className={textareaCls} placeholder='{"data": "value"}' />
    </Field>
    <Field label="Timeout (ms)">
      <input type="number" {...register('config.timeout', { valueAsNumber: true })} className={inputCls} placeholder="5000" />
    </Field>
  </>
)

const TransformConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Transform Type">
      <select {...register('config.transformType')} className={selectCls}>
        {['map','filter','reduce','aggregate','custom'].map(t => (
          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
        ))}
      </select>
    </Field>
    <Field label="Transform Code" hint="JavaScript expression">
      <textarea rows={5} {...register('config.transformCode')} className={textareaCls} placeholder="(data) => data.map(item => ({ ...item }))" />
    </Field>
  </>
)

const DecisionConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Condition" hint="Boolean expression evaluated at runtime">
      <input {...register('config.condition')} className={inputCls} placeholder="data.value > 100" />
    </Field>
    <Field label="True Branch Label">
      <input {...register('config.trueLabel')} className={inputCls} placeholder="Yes" />
    </Field>
    <Field label="False Branch Label">
      <input {...register('config.falseLabel')} className={inputCls} placeholder="No" />
    </Field>
  </>
)

const AiConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Model">
      <select {...register('config.model')} className={selectCls}>
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="claude-3-opus">Claude 3 Opus</option>
        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        <option value="custom">Custom</option>
      </select>
    </Field>
    <Field label="System Prompt">
      <textarea rows={4} {...register('config.prompt')} className={textareaCls} placeholder="You are a helpful assistant..." />
    </Field>
    <Field label="Max Tokens">
      <input type="number" {...register('config.maxTokens', { valueAsNumber: true })} className={inputCls} placeholder="1024" />
    </Field>
    <Field label="Temperature" hint="0 = deterministic, 2 = very creative">
      <input type="number" step="0.1" min="0" max="2" {...register('config.temperature', { valueAsNumber: true })} className={inputCls} placeholder="0.7" />
    </Field>
  </>
)

const OutputConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Output Format">
      <select {...register('config.format')} className={selectCls}>
        {['json','csv','html','text'].map(f => <option key={f}>{f.toUpperCase()}</option>)}
      </select>
    </Field>
    <Field label="Destination">
      <input {...register('config.destination')} className={inputCls} placeholder="webhook URL or storage path" />
    </Field>
  </>
)

const ProcessingConfig: React.FC<ConfigFormProps> = ({ register }) => (
  <>
    <Field label="Processing Type">
      <select {...register('config.processingType')} className={selectCls}>
        {['aggregate','validate','enrich','normalize'].map(t => (
          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
        ))}
      </select>
    </Field>
    <Field label="Script">
      <textarea rows={5} {...register('config.script')} className={textareaCls} placeholder="// JavaScript executed on each data item" />
    </Field>
  </>
)

const CONFIG_FORMS: Record<NodeType, React.FC<ConfigFormProps>> = {
  input:      InputConfig,
  api:        ApiConfig,
  transform:  TransformConfig,
  decision:   DecisionConfig,
  ai:         AiConfig,
  output:     OutputConfig,
  processing: ProcessingConfig,
}

const STATUS_OPTIONS = ['idle','running','success','error','warning'] as const

/* ── Main panel ─────────────────────────────────────────────── */
const PropertyPanel: React.FC = () => {
  const { selectedNodeId, nodes, updateNode, deleteNode, saveTemplate } = useFlowStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  const { register, reset, watch } = useForm<NodeData>({
    defaultValues: selectedNode?.data ?? {},
  })

  // Reset form when selected node changes
  useEffect(() => {
    reset(selectedNode?.data ?? {})
  }, [selectedNodeId, reset, selectedNode?.data])

  // Live-sync form values → store (debounced via change events)
  const handleChange = () => {
    if (!selectedNode) return
    const values = watch()
    updateNode(selectedNode.id, { data: values })
  }

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

  const ConfigForm = CONFIG_FORMS[selectedNode.type]

  return (
    <aside className="flex w-72 flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Properties</p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedNode.data.label}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
          {selectedNode.type}
        </span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto" onChange={handleChange}>
        {/* General section */}
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

        {/* Type-specific config */}
        <Section title="Configuration">
          <ConfigForm config={selectedNode.data.config ?? {}} register={register} />
        </Section>
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => saveTemplate(selectedNode)}
        >
          <BookMarked size={12} /> Save Template
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => deleteNode(selectedNode.id)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </aside>
  )
}

export default PropertyPanel
