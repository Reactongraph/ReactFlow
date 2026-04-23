import React from 'react'
import { Globe, Layers, Share2, ArrowLeftRight } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const METHOD_OPTIONS = [
  { value: 'GET',    label: 'GET'    },
  { value: 'POST',   label: 'POST'   },
  { value: 'PUT',    label: 'PUT'    },
  { value: 'PATCH',  label: 'PATCH'  },
  { value: 'DELETE', label: 'DELETE' },
]

const apiNodes: NodeDefinition[] = [
  {
    type: 'http-request',
    name: 'HTTP Request',
    description: 'Make any HTTP request to an external URL',
    category: 'API & HTTP',
    color: 'from-amber-500 to-amber-600',
    icon: React.createElement(Globe, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',    dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Response', dataType: 'object' }],
    fields: [
      { key: 'method',  label: 'Method',  type: 'select',   options: METHOD_OPTIONS, defaultValue: 'GET' },
      { key: 'url',     label: 'URL',     type: 'url',      placeholder: 'https://api.example.com/endpoint', required: true },
      { key: 'headers', label: 'Headers', type: 'json',     rows: 3, placeholder: '{"Authorization": "Bearer {{token}}"}' },
      { key: 'params',  label: 'Query Params', type: 'json', rows: 2, placeholder: '{"page": 1, "limit": 20}' },
      { key: 'body',    label: 'Body',    type: 'json',     rows: 4, placeholder: '{"key": "value"}', hint: 'POST / PUT / PATCH only' },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', placeholder: '5000', defaultValue: 5000 },
    ],
    defaultConfig: { method: 'GET', timeout: 5000 },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      // Simulate HTTP call
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600))
      return {
        status: 200,
        ok: true,
        url: config.url,
        method: config.method,
        data: { message: 'OK', timestamp: Date.now() },
        headers: { 'content-type': 'application/json' },
        latency: `${Math.round(400 + Math.random() * 600)}ms`,
      }
    },
  },
  {
    type: 'rest-api',
    name: 'REST API',
    description: 'Structured REST call with auth and pagination',
    category: 'API & HTTP',
    color: 'from-orange-500 to-orange-600',
    icon: React.createElement(Layers, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Input',    dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Response', dataType: 'object' }],
    fields: [
      { key: 'baseUrl',   label: 'Base URL',    type: 'url',    placeholder: 'https://api.example.com', required: true },
      { key: 'endpoint',  label: 'Endpoint',    type: 'text',   placeholder: '/v1/users' },
      { key: 'method',    label: 'Method',      type: 'select', options: METHOD_OPTIONS, defaultValue: 'GET' },
      { key: 'authType',  label: 'Auth Type',   type: 'select', options: [
        { value: 'none',   label: 'None'         },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'basic',  label: 'Basic Auth'   },
        { value: 'apikey', label: 'API Key'      },
      ], defaultValue: 'none' },
      { key: 'authValue', label: 'Auth Value',  type: 'password', placeholder: 'Token or credentials' },
      { key: 'body',      label: 'Body',        type: 'json',   rows: 4, placeholder: '{}' },
      { key: 'pagination', label: 'Pagination', type: 'boolean', hint: 'Auto-paginate results' },
    ],
    defaultConfig: { method: 'GET', authType: 'none' },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 500 + Math.random() * 700))
      return {
        status: 200,
        url: `${config.baseUrl}${config.endpoint}`,
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        pagination: { page: 1, total: 3 },
      }
    },
  },
  {
    type: 'graphql',
    name: 'GraphQL',
    description: 'Execute a GraphQL query or mutation',
    category: 'API & HTTP',
    color: 'from-pink-500 to-pink-600',
    icon: React.createElement(Share2, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Variables', dataType: 'object' }],
    outputs: [{ id: 'out', label: 'Data',      dataType: 'object' }],
    fields: [
      { key: 'endpoint',  label: 'GraphQL Endpoint', type: 'url',      placeholder: 'https://api.example.com/graphql', required: true },
      { key: 'query',     label: 'Query / Mutation',  type: 'code',     rows: 8,
        placeholder: 'query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n  }\n}' },
      { key: 'variables', label: 'Variables',         type: 'json',     rows: 3, placeholder: '{"id": "123"}' },
      { key: 'headers',   label: 'Headers',           type: 'json',     rows: 2, placeholder: '{"Authorization": "Bearer ..."}' },
    ],
    defaultConfig: {},
    executor: async (_config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800))
      return { data: { user: { id: '123', name: 'Alice' } }, errors: null }
    },
  },
  {
    type: 'webhook-response',
    name: 'Webhook Response',
    description: 'Send HTTP response back to a webhook caller',
    category: 'API & HTTP',
    color: 'from-cyan-500 to-cyan-600',
    icon: React.createElement(ArrowLeftRight, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Response Body', dataType: 'any' }],
    outputs: [],
    fields: [
      { key: 'statusCode', label: 'Status Code', type: 'number',   placeholder: '200', defaultValue: 200 },
      { key: 'headers',    label: 'Headers',     type: 'json',     rows: 2, placeholder: '{"Content-Type": "application/json"}' },
      { key: 'body',       label: 'Body',        type: 'json',     rows: 4, placeholder: '{"success": true}' },
    ],
    defaultConfig: { statusCode: 200 },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 100))
      return { sent: true, statusCode: config.statusCode ?? 200, body: input }
    },
  },
]

apiNodes.forEach(registerNode)
