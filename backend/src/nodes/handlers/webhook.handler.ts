import { Injectable } from '@nestjs/common'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

/**
 * Webhook / Input node — acts as a workflow trigger.
 * At runtime it just passes the trigger data downstream.
 */
@Injectable()
export class WebhookHandler extends BaseNodeHandler {
  readonly nodeType = 'input'

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const triggerData = ctx.inputData['__trigger__']
    await ctx.logger.info('Workflow triggered', triggerData)
    return { data: triggerData ?? { triggered: true, timestamp: new Date().toISOString() } }
  }
}
