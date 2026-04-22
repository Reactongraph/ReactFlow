/**
 * Demo data seeder — run with:
 *   npm run seed
 *
 * Idempotent: re-running skips already-existing records (matched by email / name).
 * Safe to run against an empty database or one that already has seed data.
 */

import 'reflect-metadata'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

dotenv.config()

// ── Inline entity imports (avoid circular NestJS bootstrap) ──────
import { User }            from '../users/entities/user.entity'
import { Workflow }        from '../workflows/entities/workflow.entity'
import { WorkflowVersion } from '../workflows/entities/workflow-version.entity'
import { WorkflowRun }     from '../execution/entities/workflow-run.entity'
import { ExecutionLog }    from '../execution/entities/execution-log.entity'
import { Schedule }        from '../scheduler/entities/schedule.entity'

// ── Connect ──────────────────────────────────────────────────────
const ds = new DataSource({
  type:     'postgres',
  url:       process.env.DATABASE_URL,
  host:      process.env.DB_HOST     ?? 'localhost',
  port:      parseInt(process.env.DB_PORT  ?? '5432', 10),
  username:  process.env.DB_USERNAME ?? 'postgres',
  password:  process.env.DB_PASSWORD ?? 'postgres',
  database:  process.env.DB_NAME     ?? 'flowbuilder',
  ssl:       process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  entities:  [User, Workflow, WorkflowVersion, WorkflowRun, ExecutionLog, Schedule],
  synchronize: false,
})

// ── Helpers ──────────────────────────────────────────────────────
const ms = (s: TemplateStringsArray, ...v: unknown[]) =>
  String.raw(s, ...v)

function log(msg: string) { console.log(`  ${msg}`) }
function ok(msg: string)  { console.log(`  ✓ ${msg}`) }

function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000)
}

// ── Node / edge factory helpers ───────────────────────────────────
function node(
  id: string, type: string, label: string,
  x: number, y: number,
  config: Record<string, unknown> = {},
  description?: string,
) {
  return { id, type, label, position: { x, y }, data: { label, description: description ?? null }, config }
}

function edge(id: string, source: string, target: string, sourceHandle?: string) {
  return { id, source, target, sourceHandle: sourceHandle ?? null, targetHandle: null, type: 'smoothstep' }
}

// ── Workflow definitions ──────────────────────────────────────────
const WORKFLOWS: Array<{
  name: string
  description: string
  tags: string[]
  nodes: ReturnType<typeof node>[]
  edges: ReturnType<typeof edge>[]
  settings: Record<string, unknown>
}> = [
  // 1. Weather → AI summary → Email
  {
    name: 'Daily Weather Briefing',
    description: 'Fetches weather data every morning, summarizes it with AI, and emails the team.',
    tags: ['ai', 'email', 'scheduled'],
    settings: { maxRetries: 2, retryDelay: 2000, timeout: 30000 },
    nodes: [
      node('n1', 'input',    'Trigger',           60,  200, {}, 'Runs on schedule every morning'),
      node('n2', 'api',      'Fetch Weather',     300, 200,
        { method: 'GET', url: 'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&daily=temperature_2m_max,precipitation_sum&forecast_days=1&timezone=America/New_York' },
        'Open-Meteo free weather API'),
      node('n3', 'ai',       'AI Summary',        560, 200,
        { model: 'gpt-4o-mini', task: 'summarize', prompt: 'Write a friendly one-paragraph weather briefing for the team based on this forecast data.' },
        'Generates a human-friendly summary'),
      node('n4', 'output',   'Send Email',        820, 200,
        { to: 'team@company.com', subject: 'Your Daily Weather Briefing' },
        'Sends the summary to the team'),
    ],
    edges: [
      edge('e1', 'n1', 'n2'),
      edge('e2', 'n2', 'n3'),
      edge('e3', 'n3', 'n4'),
    ],
  },

  // 2. Webhook → Validate → Branch → Notify
  {
    name: 'Order Processing Pipeline',
    description: 'Receives new orders via webhook, validates them, routes high-value orders for review.',
    tags: ['webhook', 'ecommerce', 'decision'],
    settings: { maxRetries: 3, retryDelay: 1000, timeout: 15000 },
    nodes: [
      node('n1', 'input',      'New Order Webhook',  60,  200, { dataType: 'json' }, 'Triggered by the e-commerce platform'),
      node('n2', 'processing', 'Validate Order',     300, 200,
        { processingType: 'validate' },
        'Checks required fields, inventory, payment status'),
      node('n3', 'decision',   'High Value?',        560, 200,
        { condition: 'input?.total > 500', trueLabel: 'yes', falseLabel: 'no' },
        'Routes orders > $500 for manual review'),
      node('n4', 'api',        'Notify Slack',       820, 100,
        { method: 'POST', url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL', body: '{"text":"🚨 High-value order requires review: {{total}}"}' },
        'Pings #orders-review channel'),
      node('n5', 'api',        'Auto-Confirm',       820, 320,
        { method: 'POST', url: 'https://api.yourstore.com/orders/confirm', headers: '{"Authorization":"Bearer {{API_KEY}}"}' },
        'Automatically confirms standard orders'),
    ],
    edges: [
      edge('e1', 'n1', 'n2'),
      edge('e2', 'n2', 'n3'),
      edge('e3', 'n3', 'n4', 'yes'),
      edge('e4', 'n3', 'n5', 'no'),
    ],
  },

  // 3. Data ETL pipeline
  {
    name: 'User Data ETL',
    description: 'Pulls user records from an API, normalizes them, aggregates stats, and stores results.',
    tags: ['etl', 'data', 'transform'],
    settings: { maxRetries: 2, timeout: 60000 },
    nodes: [
      node('n1', 'input',      'Start',          60,  200, {}),
      node('n2', 'api',        'Fetch Users',    280, 200,
        { method: 'GET', url: 'https://jsonplaceholder.typicode.com/users' }),
      node('n3', 'transform',  'Normalize',      520, 200,
        { transformType: 'map',
          transformCode: `return { id: item.id, name: item.name, email: item.email.toLowerCase(), domain: item.email.split('@')[1], city: item.address?.city }` }),
      node('n4', 'transform',  'Filter Active',  760, 200,
        { transformType: 'filter',
          transformCode: `item.email && item.name` }),
      node('n5', 'processing', 'Aggregate Stats',1000, 200,
        { processingType: 'aggregate' }),
      node('n6', 'output',     'Results',        1240, 200,
        { format: 'json' }),
    ],
    edges: [
      edge('e1', 'n1', 'n2'),
      edge('e2', 'n2', 'n3'),
      edge('e3', 'n3', 'n4'),
      edge('e4', 'n4', 'n5'),
      edge('e5', 'n5', 'n6'),
    ],
  },

  // 4. AI content generator
  {
    name: 'Blog Post Generator',
    description: 'Takes a topic from a webhook, generates a full blog post draft with title, body, and tags.',
    tags: ['ai', 'content', 'automation'],
    settings: { maxRetries: 1, timeout: 45000 },
    nodes: [
      node('n1', 'input',      'Topic Input',    60,  200,
        { dataType: 'json', sampleData: '{"topic":"10 tips for remote work","audience":"developers","tone":"casual"}' }),
      node('n2', 'ai',         'Generate Title', 300, 80,
        { model: 'gpt-4o-mini', task: 'generate', jsonOutput: true,
          prompt: 'Generate 3 catchy blog post titles for this topic. Return JSON: {"titles": [...]}' }),
      node('n3', 'ai',         'Write Body',     300, 320,
        { model: 'gpt-4o-mini', task: 'generate', maxTokens: 2048,
          prompt: 'Write a detailed, engaging blog post body (800-1000 words) for this topic.' }),
      node('n4', 'ai',         'Generate Tags',  560, 200,
        { model: 'gpt-4o-mini', task: 'extract', jsonOutput: true,
          prompt: 'Extract 5-8 SEO-friendly tags. Return JSON: {"tags": [...]}' }),
      node('n5', 'transform',  'Assemble Post',  800, 200,
        { transformType: 'custom',
          transformCode: `return { title: data.n2?.result?.titles?.[0], body: data.n3?.result, tags: data.n4?.result?.tags, createdAt: new Date().toISOString() }` }),
      node('n6', 'output',     'Published Draft',1040, 200, { format: 'json' }),
    ],
    edges: [
      edge('e1', 'n1', 'n2'),
      edge('e2', 'n1', 'n3'),
      edge('e3', 'n2', 'n4'),
      edge('e4', 'n3', 'n4'),
      edge('e5', 'n4', 'n5'),
      edge('e6', 'n5', 'n6'),
    ],
  },

  // 5. Simple HTTP health monitor
  {
    name: 'API Health Monitor',
    description: 'Pings multiple endpoints and alerts Slack if any return an error status.',
    tags: ['monitoring', 'devops', 'scheduled'],
    settings: { maxRetries: 1, timeout: 10000 },
    nodes: [
      node('n1', 'input',    'Schedule Trigger', 60,  200, {}),
      node('n2', 'api',      'Check API 1',      300, 100, { method: 'GET', url: 'https://httpstat.us/200', timeout: 5000 }),
      node('n3', 'api',      'Check API 2',      300, 300, { method: 'GET', url: 'https://httpstat.us/200', timeout: 5000 }),
      node('n4', 'decision', 'All Healthy?',     560, 200,
        { condition: `input?.status === 200`, trueLabel: 'yes', falseLabel: 'no' }),
      node('n5', 'output',   'Alert Team',       800, 320,
        { to: 'devops@company.com', subject: '🚨 API Health Check Failed' }),
      node('n6', 'output',   'Log OK',           800, 100, {}),
    ],
    edges: [
      edge('e1', 'n1', 'n2'),
      edge('e2', 'n1', 'n3'),
      edge('e3', 'n2', 'n4'),
      edge('e4', 'n4', 'n5', 'no'),
      edge('e5', 'n4', 'n6', 'yes'),
    ],
  },
]

// ── Run definitions (realistic history per workflow) ─────────────
interface RunSeed {
  status: 'completed' | 'failed' | 'cancelled'
  triggerType: 'manual' | 'scheduled' | 'webhook'
  minutesAgo: number
  durationMs: number
  errorMessage?: string
}

const RUN_HISTORY: RunSeed[][] = [
  // Weather briefing — runs daily
  [
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 10,   durationMs: 3820 },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 1450, durationMs: 4100 },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 2900, durationMs: 3650 },
    { status: 'failed',    triggerType: 'scheduled', minutesAgo: 4350, durationMs: 1200, errorMessage: 'OpenAI rate limit exceeded' },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 5800, durationMs: 3910 },
  ],
  // Order pipeline — triggered by webhooks
  [
    { status: 'completed', triggerType: 'webhook',   minutesAgo: 5,    durationMs: 890  },
    { status: 'completed', triggerType: 'webhook',   minutesAgo: 18,   durationMs: 740  },
    { status: 'failed',    triggerType: 'webhook',   minutesAgo: 45,   durationMs: 320, errorMessage: 'Slack webhook URL not configured' },
    { status: 'completed', triggerType: 'webhook',   minutesAgo: 120,  durationMs: 910  },
    { status: 'completed', triggerType: 'manual',    minutesAgo: 240,  durationMs: 870  },
    { status: 'cancelled', triggerType: 'webhook',   minutesAgo: 360,  durationMs: 0    },
  ],
  // ETL — manual runs
  [
    { status: 'completed', triggerType: 'manual',    minutesAgo: 30,   durationMs: 8430 },
    { status: 'completed', triggerType: 'manual',    minutesAgo: 1500, durationMs: 9120 },
    { status: 'failed',    triggerType: 'manual',    minutesAgo: 3000, durationMs: 2100, errorMessage: 'jsonplaceholder.typicode.com connection timeout' },
  ],
  // Blog generator — manual
  [
    { status: 'completed', triggerType: 'manual',    minutesAgo: 90,   durationMs: 14200 },
    { status: 'completed', triggerType: 'manual',    minutesAgo: 300,  durationMs: 12800 },
  ],
  // Health monitor — frequent scheduled
  [
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 2,    durationMs: 1100 },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 17,   durationMs: 980  },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 32,   durationMs: 1050 },
    { status: 'failed',    triggerType: 'scheduled', minutesAgo: 47,   durationMs: 5200, errorMessage: 'httpstat.us 503: Service Unavailable' },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 62,   durationMs: 1020 },
    { status: 'completed', triggerType: 'scheduled', minutesAgo: 77,   durationMs: 1090 },
  ],
]

// ── Log generators (realistic per workflow) ───────────────────────
function buildLogs(runId: string, wfNodes: ReturnType<typeof node>[], run: RunSeed): Partial<ExecutionLog>[] {
  const logs: Partial<ExecutionLog>[] = []
  const base = new Date(Date.now() - run.minutesAgo * 60_000)

  const addLog = (
    nodeId: string | null, nodeLabel: string | null,
    level: ExecutionLog['level'], message: string,
    offsetMs: number, durationMs?: number,
  ) => logs.push({
    id: uuid(), runId, nodeId, nodeLabel, level, message,
    durationMs: durationMs ?? null,
    createdAt: new Date(base.getTime() + offsetMs),
  })

  addLog(null, null, 'info', `Workflow started — ${wfNodes.length} nodes`, 0)

  let cursor = 50
  for (let i = 0; i < wfNodes.length; i++) {
    const n = wfNodes[i]
    const nodeDur = Math.round(run.durationMs / wfNodes.length * (0.7 + Math.random() * 0.6))

    addLog(n.id, n.label, 'info', `Executing node "${n.label}"`, cursor)

    if (run.status === 'failed' && i === wfNodes.length - 2) {
      // Fail on second-to-last node
      addLog(n.id, n.label, 'error', run.errorMessage!, cursor + nodeDur)
      addLog(null, null, 'error', `Workflow failed: ${run.errorMessage}`, cursor + nodeDur + 10)
      return logs
    }

    const level = n.type === 'api' ? 'info' : 'success'
    if (n.type === 'api') {
      addLog(n.id, n.label, 'info', `GET ${(n.config.url as string).slice(0, 60)}…`, cursor + 20)
      addLog(n.id, n.label, 'info', 'Response: 200 OK', cursor + nodeDur - 20, nodeDur)
    } else if (n.type === 'ai') {
      addLog(n.id, n.label, 'info', `AI request — model: ${n.config.model ?? 'gpt-4o-mini'}`, cursor + 20)
      addLog(n.id, n.label, 'success', `AI response received (${Math.floor(200 + Math.random() * 600)} tokens)`, cursor + nodeDur - 20, nodeDur)
    } else if (n.type === 'decision') {
      addLog(n.id, n.label, 'info', `Evaluating: ${n.config.condition}`, cursor + 10)
      addLog(n.id, n.label, 'success', `Condition → ${Math.random() > 0.4 ? 'TRUE' : 'FALSE'}`, cursor + 30, nodeDur)
    } else {
      addLog(n.id, n.label, 'success', `Completed in ${nodeDur}ms`, cursor + nodeDur, nodeDur)
    }

    cursor += nodeDur + 30
  }

  if (run.status === 'completed') {
    addLog(null, null, 'success', 'Workflow completed successfully', cursor)
  }

  return logs
}

// ── Main ─────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 FlowBuilder seed starting…\n')

  await ds.initialize()
  log('Database connected')

  const userRepo    = ds.getRepository(User)
  const wfRepo      = ds.getRepository(Workflow)
  const verRepo     = ds.getRepository(WorkflowVersion)
  const runRepo     = ds.getRepository(WorkflowRun)
  const logRepo     = ds.getRepository(ExecutionLog)
  const schedRepo   = ds.getRepository(Schedule)

  // ── 1. Users ──────────────────────────────────────────────────
  console.log('👤 Seeding users…')
  const USERS = [
    { email: 'admin@flowbuilder.io', name: 'Alice Admin',   password: 'Admin1234!', role: 'admin' as const },
    { email: 'demo@flowbuilder.io',  name: 'Demo User',     password: 'Demo1234!',  role: 'user'  as const },
    { email: 'dev@flowbuilder.io',   name: 'Dev Tester',    password: 'Dev1234!',   role: 'user'  as const },
  ]

  const createdUsers: User[] = []
  for (const u of USERS) {
    let user = await userRepo.findOne({ where: { email: u.email } })
    if (!user) {
      user = userRepo.create({
        email:        u.email,
        name:         u.name,
        passwordHash: await bcrypt.hash(u.password, 12),
        role:         u.role,
        isActive:     true,
      })
      await userRepo.save(user)
      ok(`Created user: ${u.email} / ${u.password}`)
    } else {
      log(`Skip (exists): ${u.email}`)
    }
    createdUsers.push(user)
  }

  const demoUser  = createdUsers[1]  // demo@flowbuilder.io owns the workflows
  const adminUser = createdUsers[0]

  // ── 2. Workflows ──────────────────────────────────────────────
  console.log('\n📋 Seeding workflows…')
  const createdWorkflows: Workflow[] = []

  for (let i = 0; i < WORKFLOWS.length; i++) {
    const def = WORKFLOWS[i]
    let wf = await wfRepo.findOne({ where: { name: def.name, userId: demoUser.id } })

    if (!wf) {
      wf = await wfRepo.save(wfRepo.create({
        userId:      demoUser.id,
        name:        def.name,
        description: def.description,
        tags:        def.tags,
        nodes:       def.nodes,
        edges:       def.edges,
        settings:    def.settings,
        isActive:    true,
      }))
      ok(`Created workflow: "${def.name}"`)
    } else {
      log(`Skip (exists): "${def.name}"`)
    }
    createdWorkflows.push(wf)
  }

  // ── 3. Workflow versions ──────────────────────────────────────
  console.log('\n📌 Seeding workflow versions…')
  for (const wf of createdWorkflows) {
    const count = await verRepo.count({ where: { workflowId: wf.id } })
    if (count === 0) {
      await verRepo.save(verRepo.create({
        workflowId: wf.id,
        name:       'v1.0 — Initial',
        snapshot:   { nodes: wf.nodes, edges: wf.edges, settings: wf.settings, name: wf.name },
        nodeCount:  wf.nodes.length,
        edgeCount:  wf.edges.length,
        createdBy:  demoUser.id,
      }))
      ok(`Version saved for: "${wf.name}"`)
    } else {
      log(`Skip versions (exist): "${wf.name}"`)
    }
  }

  // ── 4. Schedules ─────────────────────────────────────────────
  console.log('\n⏱  Seeding schedules…')
  const SCHEDULE_DEFS = [
    { wfIdx: 0, cron: '0 8 * * 1-5', label: 'Weekdays at 8am'   }, // weather
    { wfIdx: 4, cron: '*/15 * * * *', label: 'Every 15 minutes' }, // health monitor
  ]
  for (const s of SCHEDULE_DEFS) {
    const wf = createdWorkflows[s.wfIdx]
    const exists = await schedRepo.findOne({ where: { workflowId: wf.id, cronExpression: s.cron } })
    if (!exists) {
      await schedRepo.save(schedRepo.create({
        workflowId:     wf.id,
        cronExpression: s.cron,
        label:          s.label,
        isEnabled:      true,
        runCount:       0,
      }))
      ok(`Schedule: "${s.label}" → "${wf.name}"`)
    } else {
      log(`Skip (exists): schedule for "${wf.name}"`)
    }
  }

  // ── 5. Runs + logs ────────────────────────────────────────────
  console.log('\n🏃 Seeding workflow runs + logs…')
  for (let wi = 0; wi < createdWorkflows.length; wi++) {
    const wf   = createdWorkflows[wi]
    const runs = RUN_HISTORY[wi] ?? []

    const existingCount = await runRepo.count({ where: { workflowId: wf.id } })
    if (existingCount > 0) {
      log(`Skip runs (exist): "${wf.name}"`)
      continue
    }

    for (const runDef of runs) {
      const startedAt   = ago(runDef.minutesAgo)
      const completedAt = runDef.status === 'cancelled'
        ? null
        : new Date(startedAt.getTime() + runDef.durationMs)

      const run = await runRepo.save(runRepo.create({
        workflowId:   wf.id,
        userId:       demoUser.id,
        status:       runDef.status,
        triggerType:  runDef.triggerType,
        triggerData:  runDef.triggerType === 'webhook'
          ? { source: 'webhook', event: 'order.created', orderId: `ORD-${Math.floor(Math.random() * 9000 + 1000)}` }
          : null,
        startedAt,
        completedAt,
        durationMs:   runDef.status === 'cancelled' ? null : runDef.durationMs,
        nodeCount:    wf.nodes.length,
        errorMessage: runDef.errorMessage ?? null,
        nodeResults:  {},
      }))

      const logEntries = buildLogs(run.id, WORKFLOWS[wi].nodes, runDef)
      await logRepo.save(logEntries)
    }

    ok(`${runs.length} runs seeded for: "${wf.name}"`)

    // Update workflow last run stats
    const latestRun = runs[0]
    await wfRepo.update(wf.id, {
      lastRunAt:     ago(latestRun.minutesAgo),
      lastRunStatus: latestRun.status,
      totalRuns:     runs.length,
    })
  }

  // ── 6. Summary ────────────────────────────────────────────────
  console.log('\n📊 Seed summary:')
  console.log(`  Users:     ${await userRepo.count()}`)
  console.log(`  Workflows: ${await wfRepo.count()}`)
  console.log(`  Versions:  ${await verRepo.count()}`)
  console.log(`  Schedules: ${await schedRepo.count()}`)
  console.log(`  Runs:      ${await runRepo.count()}`)
  console.log(`  Log rows:  ${await logRepo.count()}`)

  console.log('\n✅ Seed complete!\n')
  console.log('  Login credentials:')
  console.log('  ┌─────────────────────────────────────┬──────────────┐')
  console.log('  │ Email                               │ Password     │')
  console.log('  ├─────────────────────────────────────┼──────────────┤')
  console.log('  │ admin@flowbuilder.io                │ Admin1234!   │')
  console.log('  │ demo@flowbuilder.io                 │ Demo1234!    │')
  console.log('  │ dev@flowbuilder.io                  │ Dev1234!     │')
  console.log('  └─────────────────────────────────────┴──────────────┘\n')

  await ds.destroy()
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
