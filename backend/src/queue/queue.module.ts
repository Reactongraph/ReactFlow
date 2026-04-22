import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ExecutionProcessor } from './execution.processor'
import { WorkflowRun }        from '../execution/entities/workflow-run.entity'
import { ExecutionLog }       from '../execution/entities/execution-log.entity'
import { NodesModule }        from '../nodes/nodes.module'
import { WorkflowsModule }    from '../workflows/workflows.module'
import { WebsocketModule }    from '../websocket/websocket.module'
import { EXECUTION_QUEUE }    from '../execution/execution.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: EXECUTION_QUEUE }),
    TypeOrmModule.forFeature([WorkflowRun, ExecutionLog]),
    NodesModule,
    WorkflowsModule,
    WebsocketModule,
  ],
  providers: [ExecutionProcessor],
})
export class QueueModule {}
