import React from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, Cpu,
  Globe, Shuffle, GitFork, Sparkles,
} from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

// Import the hand-crafted components so the canvas keeps their exact look
import InputNode      from '../../InputNode'
import OutputNode     from '../../OutputNode'
import ProcessingNode from '../../ProcessingNode'
import ApiNode        from '../../ApiNode'
import TransformNode  from '../../TransformNode'
import DecisionNode   from '../../DecisionNode'
import AiNode         from '../../AiNode'

const legacyNodes: NodeDefinition[] = [
  // ── Input ────────────────────────────────────────────────────
  {
    type: 'input',
    name: 'Input',
    description: 'Trigger / data source that starts a workflow',
    category: 'Triggers',
    color: 'from-blue-500 to-blue-600',
    icon: React.createElement(ArrowDownToLine, { size: 13 }),
    inputs:  [],
    outputs: [{ id: 'out', label: 'Data', dataType: 'any' }],
    fields: [
      {
        key: 'dataType', label: 'Data Type', type: 'select',
        options: [
          { value: 'json',    label: 'JSON'    },
          { value: 'csv',     label: 'CSV'     },
          { value: 'text',    label: 'Text'    },
          { value: 'number',  label: 'Number'  },
          { value: 'boolean', label: 'Boolean' },
        ],
        defaultValue: 'json',
      },
      {
        key: 'sampleData', label: 'Sample Data', type: 'json', rows: 4,
        placeholder: '{\n  "key": "value"\n}',
        hint: 'Used for previewing and testing',
      },
    ],
    defaultConfig: { dataType: 'json' },
    component: InputNode,
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      try {
        return config.sampleData
          ? JSON.parse(config.sampleData as string)
          : { data: [{ id: 1, name: 'Alpha', value: 42 }], count: 1, source: 'input' }
      } catch {
        return { data: config.sampleData, source: 'input' }
      }
    },
  },

  // ── Output ───────────────────────────────────────────────────
  {
    type: 'output',
    name: 'Output',
    description: 'Result destination — final node in a workflow',
    category: 'Debug',
    color: 'from-emerald-500 to-emerald-600',
    icon: React.createElement(ArrowUpFromLine, { size: 13 }),
    inputs:  [{ id: 'in', label: 'Result', dataType: 'any' }],
    outputs: [],
    fields: [
      {
        key: 'format', label: 'Output Format', type: 'select',
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'csv',  label: 'CSV'  },
          { value: 'html', label: 'HTML' },
          { value: 'text', label: 'Text' },
        ],
        defaultValue: 'json',
      },
      {
        key: 'destination', label: 'Destination', type: 'text',
        placeholder: 'webhook URL or storage path',
      },
    ],
    defaultConfig: { format: 'json' },
    component: OutputNode,
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 200 + Math.random() * 250))
      return {
        delivered: true,
        format: config.format ?? 'json',
        destination: config.destination ?? 'console',
        data: input,
        bytes: JSON.stringify(input).length,
      }
    },
  },

  // ── Processing ───────────────────────────────────────────────
  {
    type: 'processing',
    name: 'Processing',
    description: 'Custom script processing — aggregate, validate, enrich',
    category: 'Data Transform',
    color: 'from-violet-500 to-violet-600',
    icon: React.createElement(Cpu, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
    fields: [
      {
        key: 'processingType', label: 'Processing Type', type: 'select',
        options: [
          { value: 'aggregate', label: 'Aggregate' },
          { value: 'validate',  label: 'Validate'  },
          { value: 'enrich',    label: 'Enrich'    },
          { value: 'normalize', label: 'Normalize' },
        ],
        defaultValue: 'aggregate',
      },
      {
        key: 'script', label: 'Script', type: 'code', rows: 6,
        placeholder: '// JavaScript executed on the input data\n// Return the processed result\nreturn data',
        hint: 'Use "data" to reference the input',
      },
    ],
    defaultConfig: { processingType: 'aggregate' },
    component: ProcessingNode,
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 400 + Math.random() * 500))
      if (config.script) {
        try {
          // eslint-disable-next-line no-new-func
          const result = new Function('data', config.script as string)(input)
          return result ?? input
        } catch (e) {
          throw new Error(`Script error: ${e}`)
        }
      }
      const arr = Array.isArray(input) ? input : [input]
      return { processed: arr.length, failed: 0, records: arr, duration: '52ms' }
    },
  },

  // ── API ──────────────────────────────────────────────────────
  {
    type: 'api',
    name: 'API Call',
    description: 'HTTP request to an external endpoint',
    category: 'API & HTTP',
    color: 'from-amber-500 to-amber-600',
    icon: React.createElement(Globe, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',    dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Response', dataType: 'object' }],
    fields: [
      {
        key: 'method', label: 'Method', type: 'select',
        options: [
          { value: 'GET',    label: 'GET'    },
          { value: 'POST',   label: 'POST'   },
          { value: 'PUT',    label: 'PUT'    },
          { value: 'DELETE', label: 'DELETE' },
          { value: 'PATCH',  label: 'PATCH'  },
        ],
        defaultValue: 'GET',
      },
      { key: 'url',     label: 'URL',     type: 'url',  placeholder: 'https://api.example.com/endpoint', required: true },
      { key: 'headers', label: 'Headers', type: 'json', rows: 2, placeholder: '{"Authorization": "Bearer ..."}' },
      { key: 'body',    label: 'Body',    type: 'json', rows: 3, placeholder: '{"data": "value"}', hint: 'POST / PUT requests' },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', placeholder: '5000', defaultValue: 5000 },
    ],
    defaultConfig: { method: 'GET', timeout: 5000 },
    component: ApiNode,
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 700 + Math.random() * 700))
      return {
        status: 200,
        ok: true,
        url: config.url,
        method: config.method ?? 'GET',
        data: { message: 'OK', timestamp: Date.now() },
        latency: `${Math.round(700 + Math.random() * 700)}ms`,
      }
    },
  },

  // ── Transform ────────────────────────────────────────────────
  {
    type: 'transform',
    name: 'Transform',
    description: 'Map, filter, reduce, or aggregate data',
    category: 'Data Transform',
    color: 'from-cyan-500 to-cyan-600',
    icon: React.createElement(Shuffle, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
    fields: [
      {
        key: 'transformType', label: 'Transform Type', type: 'select',
        options: [
          { value: 'map',       label: 'Map'       },
          { value: 'filter',    label: 'Filter'    },
          { value: 'reduce',    label: 'Reduce'    },
          { value: 'aggregate', label: 'Aggregate' },
          { value: 'custom',    label: 'Custom'    },
        ],
        defaultValue: 'map',
      },
      {
        key: 'transformCode', label: 'Transform Code', type: 'code', rows: 5,
        placeholder: '(item) => ({ ...item, computed: item.value * 2 })',
        hint: 'Arrow function. For filter: return boolean.',
      },
    ],
    defaultConfig: { transformType: 'map' },
    component: TransformNode,
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
      const arr = Array.isArray(input) ? input : [input]
      if (config.transformCode) {
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function('data', `return (${config.transformCode})(data)`)
          if (config.transformType === 'filter') return arr.filter(item => fn(item))
          return arr.map(item => fn(item))
        } catch (e) {
          throw new Error(`Transform error: ${e}`)
        }
      }
      return { transformed: arr, count: arr.length, dropped: 0 }
    },
  },

  // ── Decision ─────────────────────────────────────────────────
  {
    type: 'decision',
    name: 'Decision',
    description: 'Conditional branching — routes to Yes or No path',
    category: 'Logic & Control',
    color: 'from-pink-500 to-pink-600',
    icon: React.createElement(GitFork, { size: 13 }),
    inputs:  [{ id: 'in',    label: 'Input', dataType: 'any' }],
    outputs: [
      { id: 'yes', label: 'Yes', dataType: 'any' },
      { id: 'no',  label: 'No',  dataType: 'any' },
    ],
    fields: [
      {
        key: 'condition', label: 'Condition', type: 'text',
        placeholder: 'data.value > 100',
        hint: 'JavaScript boolean expression. Use "data" for input.',
        required: true,
      },
      { key: 'trueLabel',  label: 'True Branch Label',  type: 'text', placeholder: 'Yes', defaultValue: 'Yes' },
      { key: 'falseLabel', label: 'False Branch Label', type: 'text', placeholder: 'No',  defaultValue: 'No'  },
    ],
    defaultConfig: { trueLabel: 'Yes', falseLabel: 'No' },
    component: DecisionNode,
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 250 + Math.random() * 250))
      let result = false
      try {
        // eslint-disable-next-line no-new-func
        result = Boolean(new Function('data', `return ${config.condition}`)(input))
      } catch { result = false }
      return { branch: result ? 'yes' : 'no', condition: config.condition, result, input }
    },
  },

  // ── AI ───────────────────────────────────────────────────────
  {
    type: 'ai',
    name: 'AI Node',
    description: 'LLM / ML inference with configurable model and prompt',
    category: 'AI / LLM',
    color: 'from-purple-600 to-purple-700',
    icon: React.createElement(Sparkles, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Context', dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Result',  dataType: 'object' }],
    fields: [
      {
        key: 'model', label: 'Model', type: 'select',
        options: [
          { value: 'gpt-4',           label: 'GPT-4'           },
          { value: 'gpt-3.5-turbo',   label: 'GPT-3.5 Turbo'  },
          { value: 'claude-3-opus',   label: 'Claude 3 Opus'   },
          { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
          { value: 'custom',          label: 'Custom'          },
        ],
        defaultValue: 'gpt-4',
      },
      {
        key: 'prompt', label: 'System Prompt', type: 'textarea', rows: 4,
        placeholder: 'You are a helpful assistant...',
      },
      { key: 'maxTokens',   label: 'Max Tokens',  type: 'number', placeholder: '1024', defaultValue: 1024 },
      {
        key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', defaultValue: 0.7,
        hint: '0 = deterministic, 2 = very creative',
      },
    ],
    defaultConfig: { model: 'gpt-4', maxTokens: 1024, temperature: 0.7 },
    component: AiNode,
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 900 + Math.random() * 900))
      return {
        response: `AI response for: ${JSON.stringify(input).slice(0, 60)}…`,
        model: config.model ?? 'gpt-4',
        tokens: config.maxTokens ?? 1024,
        latency: `${Math.round(900 + Math.random() * 900)}ms`,
      }
    },
  },
]

legacyNodes.forEach(registerNode)
