import React from 'react'
import { Shuffle, Table, AlignLeft, Regex, ArrowRightLeft } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const transformNodes: NodeDefinition[] = [
  {
    type: 'transform-json',
    name: 'JSON Transform',
    description: 'Map, filter, or reshape JSON data with a JS expression',
    category: 'Data Transform',
    color: 'from-cyan-500 to-cyan-600',
    icon: React.createElement(Shuffle, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
    fields: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'map',       label: 'Map'       },
        { value: 'filter',    label: 'Filter'    },
        { value: 'reduce',    label: 'Reduce'    },
        { value: 'pick',      label: 'Pick Keys' },
        { value: 'custom',    label: 'Custom'    },
      ], defaultValue: 'map' },
      { key: 'expression', label: 'Expression', type: 'code', rows: 6,
        placeholder: '(item) => ({ id: item.id, name: item.name })',
        hint: 'Arrow function. For filter: return boolean. For reduce: (acc, item) => acc', required: true },
      { key: 'pickKeys', label: 'Pick Keys', type: 'text', placeholder: 'id,name,email', hint: 'Comma-separated (Pick mode only)' },
    ],
    defaultConfig: { mode: 'map' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 80))
      try {
        const arr = Array.isArray(input) ? input : [input]
        if (config.mode === 'pick') {
          const keys = String(config.pickKeys ?? '').split(',').map(k => k.trim()).filter(Boolean)
          return arr.map(item => Object.fromEntries(keys.map(k => [k, (item as any)[k]])))
        }
        if (config.expression) {
          // eslint-disable-next-line no-new-func
          const fn = new Function('data', `return (${config.expression})(data)`)
          if (config.mode === 'filter') return arr.filter(item => fn(item))
          if (config.mode === 'reduce') {
            // eslint-disable-next-line no-new-func
            const rfn = new Function('acc', 'item', `return (${config.expression})(acc, item)`)
            return arr.reduce((acc, item) => rfn(acc, item), {})
          }
          return arr.map(item => fn(item))
        }
      } catch (e) { throw new Error(`Transform error: ${e}`) }
      return input
    },
  },
  {
    type: 'transform-csv',
    name: 'CSV Parser',
    description: 'Parse CSV text into an array of objects',
    category: 'Data Transform',
    color: 'from-green-500 to-green-600',
    icon: React.createElement(Table, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'CSV Text', dataType: 'string' }],
    outputs: [{ id: 'out', label: 'Rows',     dataType: 'array'  }],
    fields: [
      { key: 'delimiter',  label: 'Delimiter',    type: 'text',    placeholder: ',', defaultValue: ',' },
      { key: 'hasHeader',  label: 'Has Header Row', type: 'boolean', defaultValue: true },
      { key: 'skipEmpty',  label: 'Skip Empty Rows', type: 'boolean', defaultValue: true },
      { key: 'trimValues', label: 'Trim Values',   type: 'boolean', defaultValue: true },
    ],
    defaultConfig: { delimiter: ',', hasHeader: true, skipEmpty: true, trimValues: true },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 100))
      const text = String(input ?? '')
      const delim = String(config.delimiter ?? ',')
      const lines = text.split('\n').filter(l => config.skipEmpty ? l.trim() : true)
      if (lines.length === 0) return []
      if (config.hasHeader) {
        const headers = lines[0].split(delim).map(h => config.trimValues ? h.trim() : h)
        return lines.slice(1).map(line => {
          const vals = line.split(delim)
          return Object.fromEntries(headers.map((h, i) => [h, config.trimValues ? (vals[i] ?? '').trim() : (vals[i] ?? '')]))
        })
      }
      return lines.map(line => line.split(delim).map(v => config.trimValues ? v.trim() : v))
    },
  },
  {
    type: 'transform-text',
    name: 'Text Parser',
    description: 'Extract structured data from plain text',
    category: 'Data Transform',
    color: 'from-lime-500 to-lime-600',
    icon: React.createElement(AlignLeft, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Text',   dataType: 'string' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'any'    }],
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'split',     label: 'Split'          },
        { value: 'trim',      label: 'Trim'           },
        { value: 'uppercase', label: 'Uppercase'      },
        { value: 'lowercase', label: 'Lowercase'      },
        { value: 'replace',   label: 'Find & Replace' },
        { value: 'extract',   label: 'Extract Lines'  },
      ], defaultValue: 'trim' },
      { key: 'splitBy',  label: 'Split By',    type: 'text', placeholder: '\\n', hint: 'Split operation only' },
      { key: 'find',     label: 'Find',        type: 'text', placeholder: 'old text', hint: 'Replace operation only' },
      { key: 'replace',  label: 'Replace With', type: 'text', placeholder: 'new text' },
    ],
    defaultConfig: { operation: 'trim' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 50))
      const text = String(input ?? '')
      switch (config.operation) {
        case 'split':     return text.split(String(config.splitBy ?? '\n'))
        case 'trim':      return text.trim()
        case 'uppercase': return text.toUpperCase()
        case 'lowercase': return text.toLowerCase()
        case 'replace':   return text.split(String(config.find ?? '')).join(String(config.replace ?? ''))
        case 'extract':   return text.split('\n').filter(l => l.trim())
        default:          return text
      }
    },
  },
  {
    type: 'transform-regex',
    name: 'Regex Extractor',
    description: 'Extract or replace text using regular expressions',
    category: 'Data Transform',
    color: 'from-teal-500 to-teal-600',
    icon: React.createElement(Regex, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Text',    dataType: 'string' }],
    outputs: [{ id: 'out', label: 'Matches', dataType: 'array'  }],
    fields: [
      { key: 'pattern',  label: 'Pattern',  type: 'text',    placeholder: '(\\d{4}-\\d{2}-\\d{2})', required: true, hint: 'JavaScript regex (without slashes)' },
      { key: 'flags',    label: 'Flags',    type: 'text',    placeholder: 'gi', defaultValue: 'g' },
      { key: 'mode',     label: 'Mode',     type: 'select',  options: [
        { value: 'match',   label: 'Extract Matches' },
        { value: 'replace', label: 'Replace'         },
        { value: 'test',    label: 'Test (boolean)'  },
      ], defaultValue: 'match' },
      { key: 'replacement', label: 'Replacement', type: 'text', placeholder: '$1', hint: 'Replace mode only' },
    ],
    defaultConfig: { flags: 'g', mode: 'match' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 50))
      const text = String(input ?? '')
      const re = new RegExp(String(config.pattern ?? ''), String(config.flags ?? 'g'))
      if (config.mode === 'test')    return re.test(text)
      if (config.mode === 'replace') return text.replace(re, String(config.replacement ?? ''))
      return Array.from(text.matchAll(re), m => ({ match: m[0], groups: m.slice(1), index: m.index }))
    },
  },
  {
    type: 'transform-format',
    name: 'Format Converter',
    description: 'Convert between JSON, CSV, XML, YAML, and plain text',
    category: 'Data Transform',
    color: 'from-sky-500 to-sky-600',
    icon: React.createElement(ArrowRightLeft, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Output', dataType: 'string' }],
    fields: [
      { key: 'from', label: 'From Format', type: 'select', options: [
        { value: 'json', label: 'JSON' }, { value: 'csv',  label: 'CSV'  },
        { value: 'text', label: 'Text' }, { value: 'auto', label: 'Auto-detect' },
      ], defaultValue: 'auto' },
      { key: 'to', label: 'To Format', type: 'select', options: [
        { value: 'json',   label: 'JSON'   }, { value: 'csv',  label: 'CSV'  },
        { value: 'text',   label: 'Text'   }, { value: 'table', label: 'Table (Markdown)' },
      ], defaultValue: 'json' },
      { key: 'pretty', label: 'Pretty Print', type: 'boolean', defaultValue: true },
    ],
    defaultConfig: { from: 'auto', to: 'json', pretty: true },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 80))
      if (config.to === 'json') return config.pretty ? JSON.stringify(input, null, 2) : JSON.stringify(input)
      if (config.to === 'text') return String(input)
      if (config.to === 'csv') {
        const arr = Array.isArray(input) ? input : [input]
        if (!arr.length) return ''
        const keys = Object.keys(arr[0] as object)
        return [keys.join(','), ...arr.map(r => keys.map(k => (r as any)[k]).join(','))].join('\n')
      }
      return String(input)
    },
  },
]

transformNodes.forEach(registerNode)
