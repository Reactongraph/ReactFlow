import React from 'react'
import { GitFork, ToggleLeft, Repeat, Timer, RefreshCw } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const logicNodes: NodeDefinition[] = [
  {
    type: 'logic-if',
    name: 'IF Condition',
    description: 'Branch workflow based on a boolean condition',
    category: 'Logic & Control',
    color: 'from-pink-500 to-pink-600',
    icon: React.createElement(GitFork, { size: 13 }),
    inputs:  [{ id: 'in',    label: 'Input', dataType: 'any' }],
    outputs: [
      { id: 'true',  label: 'True',  dataType: 'any' },
      { id: 'false', label: 'False', dataType: 'any' },
    ],
    fields: [
      { key: 'condition',  label: 'Condition',        type: 'text', placeholder: 'data.status === "active"', required: true, hint: 'JavaScript expression' },
      { key: 'trueLabel',  label: 'True Branch Label',  type: 'text', placeholder: 'Yes', defaultValue: 'Yes' },
      { key: 'falseLabel', label: 'False Branch Label', type: 'text', placeholder: 'No',  defaultValue: 'No'  },
    ],
    defaultConfig: { trueLabel: 'Yes', falseLabel: 'No' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 80))
      let result = false
      try {
        // eslint-disable-next-line no-new-func
        result = Boolean(new Function('data', 'input', `return ${config.condition}`)(input, input))
      } catch { result = false }
      return { branch: result ? 'true' : 'false', condition: config.condition, result, input }
    },
  },
  {
    type: 'logic-switch',
    name: 'Switch',
    description: 'Route to one of many branches by value',
    category: 'Logic & Control',
    color: 'from-rose-500 to-rose-600',
    icon: React.createElement(ToggleLeft, { size: 13 }),
    inputs:  [{ id: 'in',      label: 'Input',   dataType: 'any' }],
    outputs: [
      { id: 'case1',   label: 'Case 1', dataType: 'any' },
      { id: 'case2',   label: 'Case 2', dataType: 'any' },
      { id: 'default', label: 'Default', dataType: 'any' },
    ],
    fields: [
      { key: 'expression', label: 'Switch Expression', type: 'text',     placeholder: 'data.type', required: true },
      { key: 'cases',      label: 'Cases (JSON)',       type: 'json',     rows: 5,
        placeholder: '{"order": "case1", "invoice": "case2"}', hint: 'Map value → output handle id' },
    ],
    defaultConfig: {},
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 80))
      let value: unknown
      try {
        // eslint-disable-next-line no-new-func
        value = new Function('data', 'input', `return ${config.expression}`)(input, input)
      } catch { value = undefined }
      let cases: Record<string, string> = {}
      try { cases = JSON.parse(config.cases as string ?? '{}') } catch { /* */ }
      const branch = cases[String(value)] ?? 'default'
      return { branch, value, input }
    },
  },
  {
    type: 'logic-loop',
    name: 'Loop',
    description: 'Iterate over an array and process each item',
    category: 'Logic & Control',
    color: 'from-orange-500 to-orange-600',
    icon: React.createElement(Repeat, { size: 13 }),
    inputs:  [{ id: 'in',   label: 'Array',   dataType: 'array' }],
    outputs: [
      { id: 'item', label: 'Item',  dataType: 'any' },
      { id: 'done', label: 'Done',  dataType: 'array' },
    ],
    fields: [
      { key: 'arrayPath', label: 'Array Path',  type: 'text',    placeholder: 'data.items', hint: 'Leave blank to use entire input' },
      { key: 'batchSize', label: 'Batch Size',  type: 'number',  placeholder: '1', defaultValue: 1, hint: 'Items per iteration' },
      { key: 'maxItems',  label: 'Max Items',   type: 'number',  placeholder: '1000', defaultValue: 1000 },
    ],
    defaultConfig: { batchSize: 1, maxItems: 1000 },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 100))
      const arr = Array.isArray(input) ? input : [input]
      const max = (config.maxItems as number) ?? 1000
      return { items: arr.slice(0, max), count: Math.min(arr.length, max), total: arr.length }
    },
  },
  {
    type: 'logic-delay',
    name: 'Delay',
    description: 'Pause workflow execution for a set duration',
    category: 'Logic & Control',
    color: 'from-slate-500 to-slate-600',
    icon: React.createElement(Timer, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
    fields: [
      { key: 'duration', label: 'Duration', type: 'number', placeholder: '1000', defaultValue: 1000, required: true },
      { key: 'unit',     label: 'Unit',     type: 'select', options: [
        { value: 'ms',      label: 'Milliseconds' },
        { value: 'seconds', label: 'Seconds'      },
        { value: 'minutes', label: 'Minutes'      },
      ], defaultValue: 'ms' },
    ],
    defaultConfig: { duration: 1000, unit: 'ms' },
    executor: async (config, input, ctx) => {
      const unit = config.unit as string ?? 'ms'
      const raw  = (config.duration as number) ?? 1000
      const ms   = unit === 'minutes' ? raw * 60000 : unit === 'seconds' ? raw * 1000 : raw
      // Cap simulation at 3s
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, Math.min(ms, 3000))
        ctx.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('Aborted')) })
      })
      return input
    },
  },
  {
    type: 'logic-retry',
    name: 'Retry',
    description: 'Retry a failed node up to N times with backoff',
    category: 'Logic & Control',
    color: 'from-yellow-500 to-yellow-600',
    icon: React.createElement(RefreshCw, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [
      { id: 'success', label: 'Success', dataType: 'any' },
      { id: 'failed',  label: 'Failed',  dataType: 'any' },
    ],
    fields: [
      { key: 'maxRetries',  label: 'Max Retries',       type: 'number', placeholder: '3', defaultValue: 3 },
      { key: 'delay',       label: 'Delay (ms)',         type: 'number', placeholder: '1000', defaultValue: 1000 },
      { key: 'backoff',     label: 'Backoff Strategy',   type: 'select', options: [
        { value: 'fixed',       label: 'Fixed'       },
        { value: 'exponential', label: 'Exponential' },
        { value: 'linear',      label: 'Linear'      },
      ], defaultValue: 'exponential' },
      { key: 'retryOn',     label: 'Retry On',           type: 'text', placeholder: '500,502,503', hint: 'HTTP status codes (comma-separated)' },
    ],
    defaultConfig: { maxRetries: 3, delay: 1000, backoff: 'exponential' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 200))
      return { success: true, attempts: 1, maxRetries: config.maxRetries, input }
    },
  },
]

logicNodes.forEach(registerNode)
