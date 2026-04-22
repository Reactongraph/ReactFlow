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
respond ONLY with a valid JSON object (no markdown, no explanation) matching this TypeScript interface:
{
  name: string,
  nodes: Array<{ id: string, type: string, label: string, position: { x: number, y: number }, data: Record<string, unknown> }>,
  edges: Array<{ id: string, source: string, target: string }>
}
Available node types: trigger, http-request, transform, condition, ai, email, webhook, processing.
Position nodes in a left-to-right flow (x increases by 250 per step, y centered at 300).`

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
      }),
    })

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`)

    const json = await res.json() as { choices: Array<{ message: { content: string } }> }
    const content = json.choices[0]?.message?.content ?? ''
    return JSON.parse(content) as GeneratedWorkflow
  }

  private buildTemplateWorkflow(prompt: string): GeneratedWorkflow {
    const lower = prompt.toLowerCase()

    // Detect intent keywords and produce a sensible starter workflow
    const hasHttp    = lower.includes('http') || lower.includes('api') || lower.includes('fetch')
    const hasEmail   = lower.includes('email') || lower.includes('notify') || lower.includes('mail')
    const hasAi      = lower.includes('ai') || lower.includes('gpt') || lower.includes('openai') || lower.includes('summarize')
    const hasCondition = lower.includes('if') || lower.includes('condition') || lower.includes('check')

    const nodes: GeneratedWorkflow['nodes'] = []
    const edges: GeneratedWorkflow['edges'] = []
    let x = 100

    const addNode = (id: string, type: string, label: string, data: Record<string, unknown> = {}) => {
      nodes.push({ id, type, label, position: { x, y: 300 }, data })
      x += 250
    }

    addNode('trigger-1', 'trigger', 'Start Trigger', { triggerType: 'manual' })

    if (hasHttp) addNode('http-1',     'http-request', 'Fetch Data',      { method: 'GET', url: '' })
    if (hasAi)   addNode('ai-1',       'ai',           'AI Processing',   { model: 'gpt-4o-mini', prompt: '' })
    if (hasCondition) addNode('cond-1','condition',     'Check Condition', { operator: 'equals', leftOperand: '', rightOperand: '' })
    if (hasEmail) addNode('email-1',   'email',        'Send Email',      { to: '', subject: '', body: '' })

    if (!hasHttp && !hasAi && !hasEmail) {
      addNode('transform-1', 'transform', 'Transform Data', { expression: '' })
    }

    // Wire nodes sequentially
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        id:     `e${i}`,
        source: nodes[i - 1].id,
        target: nodes[i].id,
      })
    }

    return {
      name: `Generated: ${prompt.slice(0, 50)}${prompt.length > 50 ? '…' : ''}`,
      nodes,
      edges,
    }
  }
}
