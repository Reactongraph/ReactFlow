import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

type AITask = 'generate' | 'summarize' | 'classify' | 'extract' | 'custom'

@Injectable()
export class AiHandler extends BaseNodeHandler {
  readonly nodeType = 'ai'
  private openai: OpenAI

  constructor(private readonly config: ConfigService) {
    super()
    this.openai = new OpenAI({ apiKey: config.get<string>('openai.apiKey') })
  }

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const model       = this.cfg<string>(ctx, 'model',       'gpt-4o-mini')
    const task        = this.cfg<AITask>(ctx, 'task',         'custom')
    const prompt      = this.cfg<string>(ctx, 'prompt',       '')
    const maxTokens   = this.cfg<number>(ctx, 'maxTokens',    1024)
    const temperature = this.cfg<number>(ctx, 'temperature',  0.7)
    const jsonOutput  = this.cfg<boolean>(ctx, 'jsonOutput',  false)

    const input = this.primaryInput(ctx) ?? ''
    const systemPrompt = this.buildSystemPrompt(task, jsonOutput)
    const userPrompt   = this.buildUserPrompt(task, prompt, input)

    await ctx.logger.info(`AI node — model: ${model}, task: ${task}`)

    const response = await this.openai.chat.completions.create({
      model,
      max_tokens:  maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      ...(jsonOutput && { response_format: { type: 'json_object' } }),
    })

    const rawContent = response.choices[0]?.message?.content ?? ''
    let output: unknown = rawContent

    if (jsonOutput) {
      try { output = JSON.parse(rawContent) }
      catch { output = rawContent }
    }

    await ctx.logger.success(`AI response received (${response.usage?.total_tokens ?? 0} tokens)`)

    return {
      data: {
        result:      output,
        model:       response.model,
        tokens:      response.usage,
        rawContent,
      },
    }
  }

  private buildSystemPrompt(task: AITask, jsonOutput: boolean): string {
    const json = jsonOutput ? ' Always respond with valid JSON.' : ''
    const prompts: Record<AITask, string> = {
      generate:  `You are a creative assistant that generates high-quality text.${json}`,
      summarize: `You are an expert summarizer. Produce concise, accurate summaries.${json}`,
      classify:  `You are a classification system. Classify the input and explain your reasoning.${json}`,
      extract:   `You are a data extraction assistant. Extract structured information.${json}`,
      custom:    `You are a helpful AI assistant.${json}`,
    }
    return prompts[task] ?? prompts.custom
  }

  private buildUserPrompt(task: AITask, userPrompt: string, input: unknown): string {
    const inputStr = typeof input === 'string'
      ? input
      : JSON.stringify(input, null, 2)

    if (userPrompt) {
      return `${userPrompt}\n\nInput:\n${inputStr}`
    }

    const defaults: Record<AITask, string> = {
      generate:  `Generate content based on:\n${inputStr}`,
      summarize: `Summarize the following:\n${inputStr}`,
      classify:  `Classify the following:\n${inputStr}`,
      extract:   `Extract structured data from:\n${inputStr}`,
      custom:    inputStr,
    }
    return defaults[task] ?? inputStr
  }
}
