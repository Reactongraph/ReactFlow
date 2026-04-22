import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkflowsService }    from './workflows.service'
import { WorkflowsController } from './workflows.controller'
import { Workflow }            from './entities/workflow.entity'
import { WorkflowVersion }     from './entities/workflow-version.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowVersion])],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
