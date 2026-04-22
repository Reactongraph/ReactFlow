import { Injectable } from '@nestjs/common'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

@Injectable()
export class ProcessingHandler extends BaseNodeHandler {
  readonly nodeType = 'processing'

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const processingType = this.cfg<string>(ctx, 'processingType', 'validate')
    const script         = this.cfg<string>(ctx, 'script', '')
    const input          = this.primaryInput(ctx) ?? ctx.inputData

    await ctx.logger.info(`Processing: ${processingType}`)

    let result: unknown

    switch (processingType) {
      case 'validate': {
        result = { valid: true, data: input, errors: [], timestamp: new Date().toISOString() }
        break
      }
      case 'normalize': {
        result = this.normalize(input)
        break
      }
      case 'enrich': {
        result = { ...this.toObj(input), enrichedAt: new Date().toISOString(), source: 'FlowBuilder' }
        break
      }
      case 'aggregate': {
        const arr = Array.isArray(input) ? input : [input]
        result = {
          count:   arr.length,
          items:   arr,
          summary: `Aggregated ${arr.length} items`,
        }
        break
      }
      default: {
        result = script ? this.runScript(script, input) : input
      }
    }

    await ctx.logger.success('Processing complete')
    return { data: result }
  }

  private normalize(input: unknown): unknown {
    if (typeof input === 'string') return input.trim().toLowerCase()
    if (Array.isArray(input)) return input.map(i => this.normalize(i))
    if (input && typeof input === 'object') {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>).map(([k, v]) => [
          k.trim().toLowerCase().replace(/\s+/g, '_'),
          this.normalize(v),
        ]),
      )
    }
    return input
  }

  private toObj(input: unknown): Record<string, unknown> {
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      return input as Record<string, unknown>
    }
    return { value: input }
  }

  private runScript(code: string, input: unknown): unknown {
    try {
      const fn = new Function('input', `"use strict";\n${code}`)
      return fn(input)
    } catch (e) {
      throw new Error(`Script error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}
