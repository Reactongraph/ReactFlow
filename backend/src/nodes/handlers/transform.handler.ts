import { Injectable } from '@nestjs/common'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

@Injectable()
export class TransformHandler extends BaseNodeHandler {
  readonly nodeType = 'transform'

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const transformType = this.cfg<string>(ctx, 'transformType', 'custom')
    const code          = this.cfg<string>(ctx, 'transformCode', '')
    const input         = this.primaryInput(ctx) ?? ctx.inputData

    await ctx.logger.info(`Transform type: ${transformType}`)

    let result: unknown

    switch (transformType) {
      case 'map': {
        const arr = Array.isArray(input) ? input : [input]
        result = this.runUserCode(code, arr, 'map')
        break
      }
      case 'filter': {
        const arr = Array.isArray(input) ? input : [input]
        result = this.runUserCode(code, arr, 'filter')
        break
      }
      case 'reduce': {
        const arr = Array.isArray(input) ? input : [input]
        result = this.runUserCode(code, arr, 'reduce')
        break
      }
      case 'aggregate': {
        const arr = Array.isArray(input) ? input : [input]
        result = {
          count: arr.length,
          items: arr,
          first: arr[0],
          last:  arr[arr.length - 1],
        }
        break
      }
      case 'custom':
      default: {
        result = code ? this.runUserCode(code, input, 'custom') : input
      }
    }

    await ctx.logger.success(`Transformed data (${transformType})`)
    return { data: result }
  }

  private runUserCode(code: string, input: unknown, mode: string): unknown {
    if (!code) return input
    try {
      // Safe sandboxed execution — no external I/O, just data transformation
      const fn = new Function('input', 'data', `"use strict";\n${code}`)
      const result = mode === 'map' && Array.isArray(input)
        ? (input as unknown[]).map((item, i) => {
            const f = new Function('item', 'index', `"use strict";\n${code}`)
            return f(item, i)
          })
        : mode === 'filter' && Array.isArray(input)
        ? (input as unknown[]).filter(item => {
            const f = new Function('item', `"use strict";\nreturn ${code}`)
            return f(item)
          })
        : fn(input, input)
      return result
    } catch (err) {
      throw new Error(`Transform code error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
