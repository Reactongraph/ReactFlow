import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as cron from 'node-cron'
import { Schedule } from './entities/schedule.entity'
import { ExecutionService } from '../execution/execution.service'
import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreateScheduleDto {
  @IsString() workflowId: string
  @IsString() cronExpression: string
  @IsString() userId: string
  @IsOptional() @IsString() label?: string
}

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name)
  private readonly tasks  = new Map<string, cron.ScheduledTask>()

  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
    private readonly executionService: ExecutionService,
  ) {}

  async onModuleInit() {
    await this.loadAndRegisterAll()
  }

  onModuleDestroy() {
    for (const task of this.tasks.values()) task.stop()
    this.tasks.clear()
  }

  // ── CRUD ─────────────────────────────────────────────────────

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    if (!cron.validate(dto.cronExpression)) {
      throw new Error(`Invalid cron expression: "${dto.cronExpression}"`)
    }
    const schedule = await this.repo.save(this.repo.create({
      workflowId:     dto.workflowId,
      cronExpression: dto.cronExpression,
      label:          dto.label ?? null,
    }))
    this.registerTask(schedule, dto.userId)
    return schedule
  }

  async list(workflowId: string): Promise<Schedule[]> {
    return this.repo.find({ where: { workflowId }, order: { createdAt: 'DESC' } })
  }

  async toggle(id: string, enabled: boolean): Promise<Schedule> {
    await this.repo.update(id, { isEnabled: enabled })
    const schedule = await this.repo.findOne({ where: { id } })
    if (!schedule) throw new Error('Schedule not found')

    if (enabled) {
      this.registerTask(schedule, 'system')
    } else {
      this.tasks.get(id)?.stop()
      this.tasks.delete(id)
    }
    return schedule
  }

  async remove(id: string): Promise<void> {
    this.tasks.get(id)?.stop()
    this.tasks.delete(id)
    await this.repo.delete(id)
  }

  // ── Internal ─────────────────────────────────────────────────

  private async loadAndRegisterAll(): Promise<void> {
    const schedules = await this.repo.find({ where: { isEnabled: true } })
    for (const s of schedules) {
      this.registerTask(s, 'system')
    }
    this.logger.log(`Loaded ${schedules.length} active schedules`)
  }

  private registerTask(schedule: Schedule, userId: string): void {
    // Stop existing task if any
    this.tasks.get(schedule.id)?.stop()

    if (!cron.validate(schedule.cronExpression)) {
      this.logger.warn(`Invalid cron "${schedule.cronExpression}" for schedule ${schedule.id}`)
      return
    }

    const task = cron.schedule(schedule.cronExpression, async () => {
      this.logger.log(`Schedule ${schedule.id} triggered — workflow ${schedule.workflowId}`)
      try {
        await this.executionService.triggerRun({
          workflowId:  schedule.workflowId,
          userId,
          triggerType: 'scheduled',
          triggerData: { scheduleId: schedule.id, scheduledAt: new Date().toISOString() },
        })
        await this.repo.update(schedule.id, {
          lastRunAt: new Date(),
          runCount:  () => 'run_count + 1',
        })
      } catch (err) {
        this.logger.error(`Scheduled run failed for ${schedule.workflowId}: ${err}`)
      }
    })

    this.tasks.set(schedule.id, task)
  }
}
