import { Edge } from 'reactflow'
import { CustomNode, WorkflowTemplate } from '../types'

function n(
  id: string, type: string, label: string,
  x: number, y: number,
  config: Record<string, unknown> = {},
  description = '',
): CustomNode {
  return { id, type, position: { x, y }, data: { label, status: 'idle', config, description } }
}

function e(id: string, source: string, target: string, sourceHandle?: string): Edge {
  return {
    id, source, target,
    ...(sourceHandle ? { sourceHandle } : {}),
    type: 'smoothstep', animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  }
}

// ── 1. Webhook → Transform → Slack ────────────────────────────
const webhookSlack: WorkflowTemplate = {
  id: 'wf-webhook-slack',
  name: 'Webhook → Slack Alert',
  description: 'Receive a webhook, check status, and post a formatted Slack message to the right channel',
  category: 'Communication',
  nodes: [
    n('n1', 'trigger-webhook',  'Webhook Trigger',   80,  200, { method: 'POST', path: '/webhook/alert' }),
    n('n2', 'transform-json',   'Extract Fields',    340, 200, { mode: 'pick', pickKeys: 'id,status,message,timestamp' }),
    n('n3', 'logic-if',         'Check Status',      600, 200, { condition: 'data.status === "error"', trueLabel: 'Error', falseLabel: 'OK' }),
    n('n4', 'comm-slack',       'Slack Error Alert', 860, 80,  { text: '🚨 *Error*\nID: {{id}}\nMessage: {{message}}\nTime: {{timestamp}}' }),
    n('n5', 'comm-slack',       'Slack Success',     860, 340, { text: '✅ *Success*\nID: {{id}}\nMessage: {{message}}' }),
    n('n6', 'debug-log',        'Log Result',        1120,200, { level: 'info', message: '[WebhookSlack]' }),
  ],
  edges: [
    e('e1','n1','n2'), e('e2','n2','n3'),
    e('e3','n3','n4','true'), e('e4','n3','n5','false'),
    e('e5','n4','n6'), e('e6','n5','n6'),
  ],
}

// ── 2. Schedule → HTTP API → AI Summarize → Email ─────────────
const scheduledReport: WorkflowTemplate = {
  id: 'wf-scheduled-report',
  name: 'Daily API Report via Email',
  description: 'Runs on a cron schedule, fetches data from an API, summarizes with AI, and emails the report',
  category: 'Automation',
  nodes: [
    n('n1', 'trigger-schedule', 'Daily 9am',       80,   200, { cron: '0 9 * * 1-5', timezone: 'UTC' }),
    n('n2', 'http-request',     'Fetch Analytics', 340,  200, { method: 'GET', url: 'https://api.example.com/analytics/daily', timeout: 10000 }),
    n('n3', 'transform-json',   'Extract Metrics', 600,  200, { mode: 'pick', pickKeys: 'visits,conversions,revenue,date' }),
    n('n4', 'ai-summarize',     'AI Summary',      860,  200, { model: 'gpt-4o', style: 'executive', maxLength: 200, language: 'English' }),
    n('n5', 'comm-email',       'Email Report',    1120, 200, {
      provider: 'smtp',
      from: 'reports@example.com',
      to: 'team@example.com',
      subject: 'Daily Analytics Report',
      body: 'Hi team,\n\nHere is your daily summary:\n\n{{summary}}\n\nBest,\nFlowBuilder',
    }),
    n('n6', 'debug-output',     'Output Viewer',   1380, 200, { format: 'json', label: 'Report Sent' }),
  ],
  edges: [
    e('e1','n1','n2'), e('e2','n2','n3'),
    e('e3','n3','n4'), e('e4','n4','n5'), e('e5','n5','n6'),
  ],
}

// ── 3. CSV Upload → Parse → Validate → PostgreSQL → Slack ─────
const csvToDatabase: WorkflowTemplate = {
  id: 'wf-csv-to-db',
  name: 'CSV Upload → Database Import',
  description: 'Parse an uploaded CSV, validate rows, bulk-insert into PostgreSQL, and notify via Slack',
  category: 'Data',
  nodes: [
    n('n1', 'trigger-file-upload', 'CSV Upload',       80,   240, { mimeTypes: 'text/csv' }),
    n('n2', 'transform-csv',       'Parse CSV',        340,  240, { delimiter: ',', hasHeader: true, skipEmpty: true, trimValues: true }),
    n('n3', 'transform-json',      'Filter Valid Rows',600,  240, { mode: 'filter', expression: '(row) => row.email && row.name && row.email.includes("@")' }),
    n('n4', 'logic-if',            'Any Valid Rows?',  860,  240, { condition: 'Array.isArray(data) && data.length > 0', trueLabel: 'Yes', falseLabel: 'No' }),
    n('n5', 'db-postgres',         'Insert Users',     1120, 100, { query: 'INSERT INTO users (name, email) VALUES ($1, $2)', operation: 'execute', timeout: 15000 }),
    n('n6', 'comm-slack',          'Success Notify',   1380, 100, { text: '✅ CSV import complete — rows inserted successfully' }),
    n('n7', 'comm-slack',          'Empty File Alert', 1120, 380, { text: '⚠️ CSV upload had no valid rows to import' }),
    n('n8', 'debug-log',           'Log',              1640, 240, { level: 'info', message: '[CSVImport]' }),
  ],
  edges: [
    e('e1','n1','n2'), e('e2','n2','n3'), e('e3','n3','n4'),
    e('e4','n4','n5','true'), e('e5','n4','n7','false'),
    e('e6','n5','n6'), e('e7','n6','n8'), e('e8','n7','n8'),
  ],
}

// ── 4. Manual → AI Classify → Switch → Multi-channel Notify ───
const aiClassifyNotify: WorkflowTemplate = {
  id: 'wf-ai-classify-notify',
  name: 'AI Classify & Route Notification',
  description: 'Classify incoming text with AI and route to the right notification channel based on severity',
  category: 'AI',
  nodes: [
    n('n1', 'trigger-manual',  'Test Input',         80,   240, { payload: '{"text":"Payment gateway returning 500 errors","source":"monitoring"}' }),
    n('n2', 'ai-classify',     'Classify Severity',  340,  240, { model: 'gpt-4o', categories: 'critical\nwarning\ninfo', confidence: true }),
    n('n3', 'logic-switch',    'Route by Severity',  600,  240, { expression: 'data.label', cases: '{"critical":"case1","warning":"case2"}' }),
    n('n4', 'comm-slack',      'Critical Alert',     860,  80,  { text: '🔴 *CRITICAL*\n{{text}}\nConfidence: {{confidence}}' }),
    n('n5', 'comm-slack',      'Warning Channel',    860,  240, { text: '🟡 *Warning*\n{{text}}' }),
    n('n6', 'debug-log',       'Log Info',           860,  400, { level: 'info', message: '[Classify]' }),
    n('n7', 'comm-email',      'Email On-Call',      1120, 80,  { provider: 'smtp', from: 'alerts@example.com', to: 'oncall@example.com', subject: '🔴 Critical Alert', body: '{{text}}' }),
    n('n8', 'debug-output',    'Final Output',       1380, 240, { format: 'json', label: 'Routing Complete' }),
  ],
  edges: [
    e('e1','n1','n2'), e('e2','n2','n3'),
    e('e3','n3','n4','case1'), e('e4','n3','n5','case2'), e('e5','n3','n6','default'),
    e('e6','n4','n7'), e('e7','n4','n8'),
    e('e8','n5','n8'), e('e9','n6','n8'), e('e10','n7','n8'),
  ],
}

// ── 5. DB Change → Enrich → Redis Cache → Slack ───────────────
const dbChangeEnrich: WorkflowTemplate = {
  id: 'wf-db-change-enrich',
  name: 'DB Change → Enrich & Cache',
  description: 'React to a new database row, enrich via API, cache in Redis, and alert on high-value records',
  category: 'Data',
  nodes: [
    n('n1', 'trigger-db-change', 'New Order',          80,   200, { table: 'public.orders', operation: 'INSERT' }),
    n('n2', 'http-request',      'Fetch Customer',     340,  200, { method: 'GET', url: 'https://api.example.com/customers/{{row.customer_id}}', timeout: 5000 }),
    n('n3', 'transform-json',    'Merge Order+Customer',600, 200, { mode: 'custom', expression: '(data) => ({ ...data.order, customer: data.customer, enrichedAt: new Date().toISOString() })' }),
    n('n4', 'logic-if',          'High Value Order?',  860,  200, { condition: 'data.total > 500', trueLabel: 'VIP', falseLabel: 'Standard' }),
    n('n5', 'db-redis',          'Cache VIP Order',    1120, 80,  { operation: 'set', key: 'order:vip:{{id}}', ttl: 86400 }),
    n('n6', 'db-redis',          'Cache Standard',     1120, 340, { operation: 'set', key: 'order:{{id}}', ttl: 3600 }),
    n('n7', 'comm-slack',        'VIP Alert',          1380, 80,  { text: '💎 *VIP Order* #{{id}}\nCustomer: {{customer.name}}\nTotal: ${{total}}' }),
    n('n8', 'debug-output',      'Order Processed',    1640, 200, { format: 'json', label: 'Done' }),
  ],
  edges: [
    e('e1','n1','n2'), e('e2','n2','n3'), e('e3','n3','n4'),
    e('e4','n4','n5','true'), e('e5','n4','n6','false'),
    e('e6','n5','n7'), e('e7','n5','n8'),
    e('e8','n6','n8'), e('e9','n7','n8'),
  ],
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  webhookSlack,
  scheduledReport,
  csvToDatabase,
  aiClassifyNotify,
  dbChangeEnrich,
]
