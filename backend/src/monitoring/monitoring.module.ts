import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MonitoringService }    from './monitoring.service'
import { MonitoringController } from './monitoring.controller'
import { WorkflowRun }          from '../execution/entities/workflow-run.entity'
import { ExecutionLog }         from '../execution/entities/execution-log.entity'

@Module({
  imports:     [TypeOrmModule.forFeature([WorkflowRun, ExecutionLog])],
  controllers: [MonitoringController],
  providers:   [MonitoringService],
  exports:     [MonitoringService],
})
export class MonitoringModule {}
