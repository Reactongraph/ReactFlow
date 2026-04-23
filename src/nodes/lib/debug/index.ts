import React from 'react'
import { ScrollText, Bug, Eye, FlaskConical } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const debugNodes: NodeDefinition[] = [
  {
    type: 'debug-log',
    name: 'Log',
    description: 'Log data to the execution console',
    category: 'Debug',
    color: 'from-slate-400 to-slate-500',
    icon: React.createElement(ScrollText, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
    fields: [
      { key: 'level',   label: 'Log Level', type: 'select', options: [
        { value: 'info',    label: 'Info'    },
        { value: 'warn',    label: 'Warning' },
        { value: 'error',   label: 'Error'   },
        { value: 'debug',   label: 'Debug'   },
      ], defaultValue: 'info' },
      { key: 'message', label: 'Message Prefix', type: 'text', placeholder: '[MyWorkflow]' },
      { key: 'pretty',  label: 'Pretty Print JSON', type: 'boolean', defaultValue: true },
    ],
    defaultConfig: { level: 'info', pretty: true },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 20))
      const msg = config.message ? `${config.message} ` : ''
      const out = config.pretty ? JSON.stringify(input, null, 2) : JSON.stringify(input)
      console.log(`[${String(config.level ?? 'info').toUpperCase()}] ${msg}${out}`)
      return input // pass-through
    },
  },
  {
    type: 'debug-inspect',
    name: 'Debug Inspector',
    description: 'Inspect data shape, types, and values at runtime',
    category: 'Debug',
    color: 'from-orange-400 to-orange-500',
    icon: React.createElement(Bug, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
    fields: [
      { key: 'showType',   label: 'Show Type',   type: 'boolean', defaultValue: true  },
      { key: 'showKeys',   label: 'Show Keys',   type: 'boolean', defaultValue: true  },
      { key: 'showLength', label: 'Show Length', type: 'boolean', defaultValue: true  },
      { key: 'maxDepth',   label: 'Max Depth',   type: 'number',  placeholder: '3', defaultValue: 3 },
    ],
    defaultConfig: { showType: true, showKeys: true, showLength: true, maxDepth: 3 },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 20))
      const type = Array.isArray(input) ? 'array' : typeof input
      const inspection: Record<string, unknown> = { value: input }
      if (config.showType)   inspection.type   = type
      if (config.showLength) inspection.length = Array.isArray(input) ? input.length : typeof input === 'string' ? input.length : null
      if (config.showKeys && typeof input === 'object' && input !== null) {
        inspection.keys = Object.keys(input as object)
      }
      return inspection
    },
  },
  {
    type: 'debug-output',
    name: 'Output Viewer',
    description: 'Terminal node that captures and displays final output',
    category: 'Debug',
    color: 'from-emerald-500 to-emerald-600',
    icon: React.createElement(Eye, { size: 13 }),
    inputs:  [{ id: 'in', label: 'Input', dataType: 'any' }],
    outputs: [],
    fields: [
      { key: 'format', label: 'Display Format', type: 'select', options: [
        { value: 'json',  label: 'JSON'  },
        { value: 'table', label: 'Table' },
        { value: 'text',  label: 'Text'  },
        { value: 'raw',   label: 'Raw'   },
      ], defaultValue: 'json' },
      { key: 'label', label: 'Output Label', type: 'text', placeholder: 'Final Result' },
    ],
    defaultConfig: { format: 'json' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 30))
      return {
        label: config.label ?? 'Output',
        format: config.format,
        data: input,
        capturedAt: new Date().toISOString(),
      }
    },
  },
  {
    type: 'debug-test-data',
    name: 'Test Data Generator',
    description: 'Generate realistic fake data for testing workflows',
    category: 'Debug',
    color: 'from-pink-400 to-pink-500',
    icon: React.createElement(FlaskConical, { size: 13 }),
    inputs:  [],
    outputs: [{ id: 'out', label: 'Data', dataType: 'any' }],
    fields: [
      { key: 'schema', label: 'Schema', type: 'select', options: [
        { value: 'users',    label: 'Users'    },
        { value: 'orders',   label: 'Orders'   },
        { value: 'products', label: 'Products' },
        { value: 'events',   label: 'Events'   },
        { value: 'custom',   label: 'Custom JSON' },
      ], defaultValue: 'users' },
      { key: 'count',  label: 'Record Count', type: 'number', placeholder: '5', defaultValue: 5 },
      { key: 'custom', label: 'Custom Template', type: 'json', rows: 6,
        placeholder: '{"id": "{{uuid}}", "name": "{{name}}"}', hint: 'Custom schema only' },
    ],
    defaultConfig: { schema: 'users', count: 5 },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 50))
      const count = Math.min((config.count as number) ?? 5, 100)
      const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank']
      const statuses = ['active', 'inactive', 'pending']
      if (config.schema === 'users') {
        return Array.from({ length: count }, (_, i) => ({
          id: i + 1, name: names[i % names.length],
          email: `${names[i % names.length].toLowerCase()}@example.com`,
          status: statuses[i % statuses.length], createdAt: new Date().toISOString(),
        }))
      }
      if (config.schema === 'orders') {
        return Array.from({ length: count }, (_, i) => ({
          id: `ORD-${1000 + i}`, userId: i + 1,
          total: parseFloat((Math.random() * 500 + 10).toFixed(2)),
          status: ['pending', 'shipped', 'delivered'][i % 3],
          createdAt: new Date().toISOString(),
        }))
      }
      if (config.schema === 'products') {
        return Array.from({ length: count }, (_, i) => ({
          id: i + 1, name: `Product ${i + 1}`,
          price: parseFloat((Math.random() * 200 + 5).toFixed(2)),
          stock: Math.floor(Math.random() * 500),
          category: ['Electronics', 'Clothing', 'Books'][i % 3],
        }))
      }
      return Array.from({ length: count }, (_, i) => ({ id: i + 1, value: Math.random(), timestamp: Date.now() }))
    },
  },
]

debugNodes.forEach(registerNode)
