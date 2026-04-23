import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface GeneratedWorkflow {
  name:  string
  nodes: Array<{
    id:       string
    type:     string
    label:    string
    position: { x: number; y: number }
    data:     Record<string, unknown>
  }>
  edges: Array<{
    id:     string
    source: string
    target: string
  }>
}

@Injectable()
export class AiBuilderService {
  private readonly logger = new Logger(AiBuilderService.name)

  constructor(private readonly cfg: ConfigService) {}

  async generateWorkflow(prompt: string): Promise<GeneratedWorkflow> {
    const apiKey = this.cfg.get<string>('openai.apiKey')

    if (apiKey) {
      try {
        return await this.callOpenAI(prompt, apiKey)
      } catch (err) {
        this.logger.warn(`OpenAI call failed, falling back to template: ${(err as Error).message}`)
      }
    }

    return this.buildTemplateWorkflow(prompt)
  }

  private async callOpenAI(prompt: string, apiKey: string): Promise<GeneratedWorkflow> {
    const systemPrompt = `You are a workflow automation expert. When given a description of an automation task,
respond ONLY with a valid JSON object (no markdown, no explanation, no code fences) matching this exact TypeScript interface:
{
  name: string,
  nodes: Array<{ id: string, type: string, label: string, position: { x: number, y: number }, data: Record<string, unknown> }>,
  edges: Array<{ id: string, source: string, target: string }>
}

You MUST use ONLY these exact node type strings (copy them exactly, no variations):

TRIGGERS (no inputs, start the flow):
  trigger-webhook   — start on HTTP webhook
  trigger-schedule  — start on cron schedule
  trigger-manual    — start manually with test data
  trigger-email     — start when email received
  trigger-db-change — start on database row change
  trigger-file-upload — start when file uploaded

API & HTTP:
  http-request      — make HTTP GET/POST/PUT/DELETE request
  rest-api          — structured REST call with auth
  graphql           — GraphQL query or mutation
  webhook-response  — send HTTP response back

AI / LLM:
  ai-text-gen       — generate text with GPT
  ai-summarize      — summarize long text
  ai-classify       — classify text into categories
  ai-embedding      — generate vector embeddings

LOGIC & CONTROL:
  logic-if          — IF condition branch (true/false outputs)
  logic-switch      — switch/route by value
  logic-loop        — iterate over array
  logic-delay       — pause execution
  logic-retry       — retry on failure

DATA TRANSFORM:
  transform-json    — map/filter/reshape JSON
  transform-csv     — parse CSV to objects
  transform-text    — text operations
  transform-regex   — regex extract/replace
  transform-format  — convert between formats

DATABASE:
  db-postgres       — PostgreSQL query
  db-mongodb        — MongoDB query
  db-redis          — Redis get/set

COMMUNICATION:
  comm-email        — send email
  comm-slack        — post Slack message
  comm-discord      — send Discord message
  comm-push         — push notification

FILES:
  file-upload       — upload to S3/GCS
  file-download     — download file
  file-pdf          — parse PDF
  file-image        — process image

UTILITIES:
  util-date         — format/parse dates
  util-uuid         — generate UUID
  util-math         — math calculation
  util-string       — string manipulation

DEBUG / OUTPUT:
  debug-log         — log to console
  debug-output      — capture final output (terminal node, no outputs)
  debug-inspect     — inspect data shape

Rules:
- Always start with a trigger node (trigger-* type)
- Always end with debug-output or webhook-response
- Position nodes left-to-right: x increases by 260 per step, y=250
- Use realistic label names (e.g. "Fetch User Data" not "HTTP Request")
- Put relevant config in the data field (url, method, model, condition, etc.)
- Respond with ONLY the JSON object, no markdown, no explanation`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: prompt },
        ],
        temperature: 0.3,
        max_tokens:  2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`)

    const json = await res.json() as { choices: Array<{ message: { content: string } }> }
    const content = json.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(content) as GeneratedWorkflow

    // Sanitise: strip any markdown fences GPT might still add
    return parsed
  }

  private buildTemplateWorkflow(prompt: string): GeneratedWorkflow {
    const lower = prompt.toLowerCase()

    const hasHttp      = lower.includes('http') || lower.includes('api') || lower.includes('fetch')
    const hasEmail     = lower.includes('email') || lower.includes('notify') || lower.includes('mail')
    const hasSlack     = lower.includes('slack')
    const hasAi        = lower.includes('ai') || lower.includes('gpt') || lower.includes('openai') || lower.includes('summarize')
    const hasCondition = lower.includes('if') || lower.includes('condition') || lower.includes('check')
    const hasDb        = lower.includes('database') || lower.includes('postgres') || lower.includes('mongo') || lower.includes('redis')

    const nodes: GeneratedWorkflow['nodes'] = []
    const edges: GeneratedWorkflow['edges'] = []
    let x = 100

    const addNode = (id: string, type: string, label: string, data: Record<string, unknown> = {}) => {
      nodes.push({ id, type, label, position: { x, y: 250 }, data })
      x += 260
    }

    // Always start with a trigger
    addNode('n1', 'trigger-manual', 'Start Trigger', { payload: '{}' })

    if (hasHttp)      addNode('n2', 'http-request',  'Fetch Data',      { method: 'GET', url: 'https://api.example.com/data', timeout: 5000 })
    if (hasAi)        addNode('n3', 'ai-text-gen',   'AI Processing',   { model: 'gpt-4o', userPrompt: 'Process: {{input}}', maxTokens: 512 })
    if (hasCondition) addNode('n4', 'logic-if',      'Check Condition', { condition: 'data.status === "success"', trueLabel: 'Yes', falseLabel: 'No' })
    if (hasDb)        addNode('n5', 'db-postgres',   'Save to DB',      { query: 'INSERT INTO results (data) VALUES ($1)', operation: 'execute' })
    if (hasSlack)     addNode('n6', 'comm-slack',    'Post to Slack',   { text: 'Workflow completed: {{status}}' })
    if (hasEmail)     addNode('n7', 'comm-email',    'Send Email',      { from: 'noreply@example.com', to: 'user@example.com', subject: 'Workflow Result', body: '{{result}}' })

    // Always end with output
    addNode(`n${nodes.length + 1}`, 'debug-output', 'Output', { format: 'json', label: 'Final Result' })

    // Wire nodes sequentially
    for (let i = 1; i < nodes.length; i++) {
      edges.push({ id: `e${i}`, source: nodes[i - 1].id, target: nodes[i].id })
    }

    return {
      name: `Generated: ${prompt.slice(0, 50)}${prompt.length > 50 ? '…' : ''}`,
      nodes,
      edges,
    }
  }
}
