import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { BaseNodeHandler } from './handlers/base.handler'
import { HttpRequestHandler } from './handlers/http-request.handler'
import { TransformHandler }   from './handlers/transform.handler'
import { ConditionHandler }   from './handlers/condition.handler'
import { AiHandler }          from './handlers/ai.handler'
import { WebhookHandler }     from './handlers/webhook.handler'
import { EmailHandler }       from './handlers/email.handler'
import { ProcessingHandler }  from './handlers/processing.handler'

@Injectable()
export class NodeRegistryService implements OnModuleInit {
  private readonly logger = new Logger(NodeRegistryService.name)
  private readonly handlers = new Map<string, BaseNodeHandler>()

  constructor(
    private readonly httpHandler:        HttpRequestHandler,
    private readonly transformHandler:   TransformHandler,
    private readonly conditionHandler:   ConditionHandler,
    private readonly aiHandler:          AiHandler,
    private readonly webhookHandler:     WebhookHandler,
    private readonly emailHandler:       EmailHandler,
    private readonly processingHandler:  ProcessingHandler,
  ) {}

  onModuleInit() {
    const all = [
      this.httpHandler,
      this.transformHandler,
      this.conditionHandler,
      this.aiHandler,
      this.webhookHandler,
      this.emailHandler,
      this.processingHandler,
    ]
    for (const handler of all) {
      this.register(handler)
    }
    this.logger.log(`Node registry initialized — ${this.handlers.size} handlers: [${[...this.handlers.keys()].join(', ')}]`)
  }

  register(handler: BaseNodeHandler): void {
    this.handlers.set(handler.nodeType, handler)
  }

  getHandler(nodeType: string): BaseNodeHandler | undefined {
    return this.handlers.get(nodeType)
  }

  listHandlers(): string[] {
    return [...this.handlers.keys()]
  }
}
