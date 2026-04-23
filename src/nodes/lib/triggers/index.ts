import React from 'react'
import {
  Webhook, Clock, Mail, Database, Upload, Play,
} from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const triggers: NodeDefinition[] = [
  {
    type: 'trigger-webhook',
    name: 'Webhook Trigger',
    description: 'Start workflow on incoming HTTP request',
    category: 'Triggers',
    color: 'from-blue-500 to-blue-600',
    icon: React.createElement(Webhook, { size: 13 }),
    inputs: [],
    outputs: [{ id: 'out', label: 'Payload', dataType: 'object' }],
    fields: [
      { key: 'path',   label: 'Path',   type: 'text', placeholder: '/webhook/my-flow', hint: 'Relative URL path' },
      { key: 'method', label: 'Method', type: 'select', options: [
        { value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' },
        { value: 'PUT', label: 'PUT' },  { value: 'ANY', label: 'ANY' },
      ], defaultValue: 'POST' },
      { key: 'secret', label: 'Secret', type: 'password', placeholder: 'Signature secret (optional)', hint: 'HMAC-SHA256 verification' },
    ],
    defaultConfig: { method: 'POST' },
    executor: async (_config, _input, _ctx) => ({
      body: { event: 'webhook', timestamp: Date.now() },
      headers: { 'content-type': 'application/json' },
      method: _config.method ?? 'POST',
    }),
  },
  {
    type: 'trigger-schedule',
    name: 'Schedule Trigger',
    description: 'Run workflow on a cron schedule',
    category: 'Triggers',
    color: 'from-indigo-500 to-indigo-600',
    icon: React.createElement(Clock, { size: 13 }),
    inputs: [],
    outputs: [{ id: 'out', label: 'Tick', dataType: 'object' }],
    fields: [
      { key: 'cron',     label: 'Cron Expression', type: 'text', placeholder: '0 9 * * 1-5', hint: 'Standard 5-field cron' },
      { key: 'timezone', label: 'Timezone',         type: 'text', placeholder: 'UTC', defaultValue: 'UTC' },
    ],
    defaultConfig: { cron: '0 9 * * 1-5', timezone: 'UTC' },
    executor: async (_config, _input, _ctx) => ({
      firedAt: new Date().toISOString(),
      cron: _config.cron,
      timezone: _config.timezone ?? 'UTC',
    }),
  },
  {
    type: 'trigger-email',
    name: 'Email Trigger',
    description: 'Trigger when an email is received',
    category: 'Triggers',
    color: 'from-sky-500 to-sky-600',
    icon: React.createElement(Mail, { size: 13 }),
    inputs: [],
    outputs: [{ id: 'out', label: 'Email', dataType: 'object' }],
    fields: [
      { key: 'mailbox', label: 'Mailbox / Label', type: 'text', placeholder: 'INBOX' },
      { key: 'filter',  label: 'Subject Filter',  type: 'text', placeholder: 'Order confirmation', hint: 'Regex or plain text' },
    ],
    defaultConfig: { mailbox: 'INBOX' },
    executor: async (_config, _input, _ctx) => ({
      from: 'sender@example.com',
      subject: 'Test Email',
      body: 'Email body content',
      receivedAt: new Date().toISOString(),
    }),
  },
  {
    type: 'trigger-db-change',
    name: 'Database Change',
    description: 'Trigger on INSERT / UPDATE / DELETE',
    category: 'Triggers',
    color: 'from-teal-500 to-teal-600',
    icon: React.createElement(Database, { size: 13 }),
    inputs: [],
    outputs: [{ id: 'out', label: 'Row', dataType: 'object' }],
    fields: [
      { key: 'table',     label: 'Table',      type: 'text',   placeholder: 'public.orders' },
      { key: 'operation', label: 'Operation',  type: 'select', options: [
        { value: 'INSERT', label: 'INSERT' }, { value: 'UPDATE', label: 'UPDATE' },
        { value: 'DELETE', label: 'DELETE' }, { value: 'ANY',    label: 'ANY' },
      ], defaultValue: 'INSERT' },
    ],
    defaultConfig: { operation: 'INSERT' },
    executor: async (_config, _input, _ctx) => ({
      operation: _config.operation,
      table: _config.table,
      row: { id: 1, changed_at: new Date().toISOString() },
    }),
  },
  {
    type: 'trigger-file-upload',
    name: 'File Upload Trigger',
    description: 'Trigger when a file is uploaded',
    category: 'Triggers',
    color: 'from-violet-500 to-violet-600',
    icon: React.createElement(Upload, { size: 13 }),
    inputs: [],
    outputs: [{ id: 'out', label: 'File', dataType: 'file' }],
    fields: [
      { key: 'bucket',    label: 'Bucket / Path', type: 'text', placeholder: 's3://my-bucket/uploads/' },
      { key: 'mimeTypes', label: 'Allowed MIME',  type: 'text', placeholder: 'image/*,application/pdf', hint: 'Comma-separated' },
    ],
    defaultConfig: {},
    executor: async (_config, _input, _ctx) => ({
      filename: 'document.pdf',
      size: 204800,
      mimeType: 'application/pdf',
      url: 'https://storage.example.com/document.pdf',
    }),
  },
  {
    type: 'trigger-manual',
    name: 'Manual Trigger',
    description: 'Start workflow manually with test data',
    category: 'Triggers',
    color: 'from-emerald-500 to-emerald-600',
    icon: React.createElement(Play, { size: 13 }),
    inputs: [],
    outputs: [{ id: 'out', label: 'Data', dataType: 'any' }],
    fields: [
      { key: 'payload', label: 'Test Payload', type: 'json', rows: 6,
        placeholder: '{\n  "key": "value"\n}', hint: 'JSON data passed as trigger output' },
    ],
    defaultConfig: { payload: '{}' },
    executor: async (_config, _input, _ctx) => {
      try {
        return JSON.parse((_config.payload as string) || '{}')
      } catch {
        return {}
      }
    },
  },
]

triggers.forEach(registerNode)
