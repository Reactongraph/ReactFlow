import { Injectable } from '@nestjs/common'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

@Injectable()
export class ConditionHandler extends BaseNodeHandler {
  readonly nodeType = 'decision'

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const condition  = this.cfg<string>(ctx, 'condition', '')
    const trueLabel  = this.cfg<string>(ctx, 'trueLabel',  'yes')
    const falseLabel = this.cfg<string>(ctx, 'falseLabel', 'no')

    const input = this.primaryInput(ctx) ?? ctx.inputData

    if (!condition) {
      await ctx.logger.warn('No condition set — defaulting to true branch')
      return { data: input, branchId: trueLabel.toLowerCase() }
    }

    await ctx.logger.info(`Evaluating: ${condition}`)

    const result = this.evaluate(condition, input, ctx.inputData)
    const branch = result ? trueLabel.toLowerCase() : falseLabel.toLowerCase()

    await ctx.logger.success(`Condition → ${result ? 'TRUE' : 'FALSE'} — routing to "${branch}"`)

    return { data: input, branchId: branch }
  }

  private evaluate(condition: string, input: unknown, inputData: Record<string, unknown>): boolean {
    try {
      const fn = new Function('input', 'data', `"use strict";\nreturn Boolean(${condition})`)
      return fn(input, inputData)
    } catch (err) {
      throw new Error(`Condition evaluation error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
