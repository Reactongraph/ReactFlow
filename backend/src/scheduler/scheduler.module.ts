import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SchedulerService } from './scheduler.service'
import { Schedule }         from './entities/schedule.entity'
import { ExecutionModule }  from '../execution/execution.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule]),
    ExecutionModule,
  ],
  providers: [SchedulerService],
  exports:   [SchedulerService],
})
export class SchedulerModule {}
