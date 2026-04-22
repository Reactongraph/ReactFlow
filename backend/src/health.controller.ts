import { Controller, Get } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Public } from './auth/guards/jwt-auth.guard'

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly db: DataSource,
  ) {}

  @Public()
  @Get()
  async check() {
    const dbOk = this.db.isInitialized
    return {
      status:    dbOk ? 'ok' : 'degraded',
      db:        dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    }
  }
}
