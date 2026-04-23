import React from 'react'
import { Calendar, Fingerprint, Dices, Calculator, Type } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const utilityNodes: NodeDefinition[] = [
  {
    type: 'util-date',
    name: 'Date Formatter',
    description: 'Parse, format, and manipulate dates and times',
    category: 'Utilities',
    color: 'from-amber-500 to-amber-600',
    icon: React.createElement(Calendar, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Date',   dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'string' }],
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'format',    label: 'Format'         },
        { value: 'parse',     label: 'Parse'          },
        { value: 'add',       label: 'Add Duration'   },
        { value: 'subtract',  label: 'Subtract'       },
        { value: 'diff',      label: 'Difference'     },
        { value: 'now',       label: 'Current Time'   },
      ], defaultValue: 'format' },
      { key: 'inputFormat',  label: 'Input Format',  type: 'text', placeholder: 'ISO 8601 or auto', defaultValue: 'auto' },
      { key: 'outputFormat', label: 'Output Format', type: 'text', placeholder: 'YYYY-MM-DD HH:mm:ss', defaultValue: 'YYYY-MM-DD' },
      { key: 'timezone',     label: 'Timezone',      type: 'text', placeholder: 'UTC', defaultValue: 'UTC' },
      { key: 'amount',       label: 'Amount',        type: 'number', placeholder: '1', hint: 'Add/Subtract only' },
      { key: 'unit',         label: 'Unit',          type: 'select', options: [
        { value: 'days', label: 'Days' }, { value: 'hours', label: 'Hours' },
        { value: 'minutes', label: 'Minutes' }, { value: 'months', label: 'Months' },
      ], defaultValue: 'days' },
    ],
    defaultConfig: { operation: 'format', outputFormat: 'YYYY-MM-DD', timezone: 'UTC', unit: 'days' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 30))
      if (config.operation === 'now') return new Date().toISOString()
      const d = input ? new Date(input as string) : new Date()
      return d.toISOString()
    },
  },
  {
    type: 'util-uuid',
    name: 'UUID Generator',
    description: 'Generate one or more UUIDs',
    category: 'Utilities',
    color: 'from-slate-500 to-slate-600',
    icon: React.createElement(Fingerprint, { size: 13 }),
    inputs:  [],
    outputs: [{ id: 'out', label: 'UUID', dataType: 'string' }],
    fields: [
      { key: 'version', label: 'Version', type: 'select', options: [
        { value: 'v4', label: 'v4 (random)' }, { value: 'v1', label: 'v1 (time-based)' },
      ], defaultValue: 'v4' },
      { key: 'count',  label: 'Count',  type: 'number', placeholder: '1', defaultValue: 1, hint: 'Number of UUIDs to generate' },
      { key: 'format', label: 'Format', type: 'select', options: [
        { value: 'standard', label: 'Standard (with dashes)' },
        { value: 'compact',  label: 'Compact (no dashes)'    },
        { value: 'upper',    label: 'Uppercase'              },
      ], defaultValue: 'standard' },
    ],
    defaultConfig: { version: 'v4', count: 1, format: 'standard' },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 20))
      const count = Math.min((config.count as number) ?? 1, 100)
      const uuids = Array.from({ length: count }, () => {
        const u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
        if (config.format === 'compact') return u.replace(/-/g, '')
        if (config.format === 'upper')   return u.toUpperCase()
        return u
      })
      return count === 1 ? uuids[0] : uuids
    },
  },
  {
    type: 'util-random',
    name: 'Random Generator',
    description: 'Generate random numbers, strings, or pick from a list',
    category: 'Utilities',
    color: 'from-lime-500 to-lime-600',
    icon: React.createElement(Dices, { size: 13 }),
    inputs:  [],
    outputs: [{ id: 'out', label: 'Value', dataType: 'any' }],
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: [
        { value: 'integer', label: 'Integer'     },
        { value: 'float',   label: 'Float'       },
        { value: 'string',  label: 'String'      },
        { value: 'boolean', label: 'Boolean'     },
        { value: 'pick',    label: 'Pick from List' },
      ], defaultValue: 'integer' },
      { key: 'min',    label: 'Min',    type: 'number', placeholder: '0',   defaultValue: 0   },
      { key: 'max',    label: 'Max',    type: 'number', placeholder: '100', defaultValue: 100 },
      { key: 'length', label: 'String Length', type: 'number', placeholder: '16', defaultValue: 16, hint: 'String type only' },
      { key: 'list',   label: 'Pick List', type: 'textarea', rows: 3, placeholder: 'apple\nbanana\ncherry', hint: 'One item per line' },
    ],
    defaultConfig: { type: 'integer', min: 0, max: 100, length: 16 },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 20))
      const min = (config.min as number) ?? 0
      const max = (config.max as number) ?? 100
      switch (config.type) {
        case 'integer': return Math.floor(Math.random() * (max - min + 1)) + min
        case 'float':   return Math.random() * (max - min) + min
        case 'boolean': return Math.random() > 0.5
        case 'string': {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          const len = (config.length as number) ?? 16
          return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        }
        case 'pick': {
          const items = String(config.list ?? '').split('\n').filter(Boolean)
          return items[Math.floor(Math.random() * items.length)] ?? null
        }
        default: return Math.random()
      }
    },
  },
  {
    type: 'util-math',
    name: 'Math Calculator',
    description: 'Perform mathematical operations on numeric data',
    category: 'Utilities',
    color: 'from-cyan-500 to-cyan-600',
    icon: React.createElement(Calculator, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'number' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'number' }],
    fields: [
      { key: 'expression', label: 'Expression', type: 'text',
        placeholder: 'Math.round(input * 1.2)', required: true,
        hint: 'JS expression. Use "input" for the incoming value.' },
      { key: 'precision', label: 'Decimal Precision', type: 'number', placeholder: '2', defaultValue: 2 },
    ],
    defaultConfig: { precision: 2 },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 20))
      try {
        // eslint-disable-next-line no-new-func
        const raw = new Function('input', 'Math', `return ${config.expression}`)(input, Math)
        const precision = (config.precision as number) ?? 2
        return typeof raw === 'number' ? parseFloat(raw.toFixed(precision)) : raw
      } catch (e) { throw new Error(`Math error: ${e}`) }
    },
  },
  {
    type: 'util-string',
    name: 'String Manipulator',
    description: 'Transform strings: template, pad, slice, encode, hash',
    category: 'Utilities',
    color: 'from-teal-500 to-teal-600',
    icon: React.createElement(Type, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'string' }],
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'template',  label: 'Template'       },
        { value: 'concat',    label: 'Concatenate'    },
        { value: 'slice',     label: 'Slice'          },
        { value: 'pad',       label: 'Pad'            },
        { value: 'base64enc', label: 'Base64 Encode'  },
        { value: 'base64dec', label: 'Base64 Decode'  },
        { value: 'urlencode', label: 'URL Encode'     },
        { value: 'urldecode', label: 'URL Decode'     },
        { value: 'slugify',   label: 'Slugify'        },
      ], defaultValue: 'template' },
      { key: 'template', label: 'Template', type: 'textarea', rows: 3,
        placeholder: 'Hello {{name}}, your order {{orderId}} is ready!', hint: 'Template mode: use {{key}} for variables' },
      { key: 'start',  label: 'Start',  type: 'number', placeholder: '0',  hint: 'Slice mode' },
      { key: 'end',    label: 'End',    type: 'number', placeholder: '10', hint: 'Slice mode' },
      { key: 'padLen', label: 'Pad Length', type: 'number', placeholder: '10', hint: 'Pad mode' },
      { key: 'padChar', label: 'Pad Char', type: 'text', placeholder: ' ', defaultValue: ' ' },
    ],
    defaultConfig: { operation: 'template', padChar: ' ' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 20))
      const str = typeof input === 'string' ? input : JSON.stringify(input)
      const data = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {}
      switch (config.operation) {
        case 'template':  return String(config.template ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => String(data[k] ?? ''))
        case 'slice':     return str.slice((config.start as number) ?? 0, (config.end as number) ?? undefined)
        case 'pad':       return str.padStart((config.padLen as number) ?? 10, String(config.padChar ?? ' '))
        case 'base64enc': return btoa(str)
        case 'base64dec': return atob(str)
        case 'urlencode': return encodeURIComponent(str)
        case 'urldecode': return decodeURIComponent(str)
        case 'slugify':   return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        default:          return str
      }
    },
  },
]

utilityNodes.forEach(registerNode)
