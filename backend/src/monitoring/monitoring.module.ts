import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MonitoringService } from './monitoring.service'
import { WorkflowRun }       from '../execution/entities/workflow-run.entity'
import { ExecutionLog }      from '../execution/entities/execution-log.entity'

@Module({
  imports:   [TypeOrmModule.forFeature([WorkflowRun, ExecutionLog])],
  providers: [MonitoringService],
  exports:   [MonitoringService],
})
export class MonitoringModule {}
