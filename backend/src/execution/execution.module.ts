import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { ExecutionService }    from './execution.service'
import { ExecutionController } from './execution.controller'
import { WorkflowRun }         from './entities/workflow-run.entity'
import { ExecutionLog }        from './entities/execution-log.entity'
import { WorkflowsModule }     from '../workflows/workflows.module'
import { EXECUTION_QUEUE }     from './execution.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowRun, ExecutionLog]),
    BullModule.registerQueue({ name: EXECUTION_QUEUE }),
    WorkflowsModule,
  ],
  controllers: [ExecutionController],
  providers:   [ExecutionService],
  exports:     [ExecutionService, TypeOrmModule],
})
export class ExecutionModule {}
