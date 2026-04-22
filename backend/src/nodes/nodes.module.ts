import { Module } from '@nestjs/common'
import { NodeRegistryService }  from './node-registry.service'
import { HttpRequestHandler }   from './handlers/http-request.handler'
import { TransformHandler }     from './handlers/transform.handler'
import { ConditionHandler }     from './handlers/condition.handler'
import { AiHandler }            from './handlers/ai.handler'
import { WebhookHandler }       from './handlers/webhook.handler'
import { EmailHandler }         from './handlers/email.handler'
import { ProcessingHandler }    from './handlers/processing.handler'

@Module({
  providers: [
    NodeRegistryService,
    HttpRequestHandler,
    TransformHandler,
    ConditionHandler,
    AiHandler,
    WebhookHandler,
    EmailHandler,
    ProcessingHandler,
  ],
  exports: [NodeRegistryService],
})
export class NodesModule {}
