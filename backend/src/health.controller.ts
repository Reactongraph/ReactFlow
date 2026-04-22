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
    let dbOk = false
    try {
      if (this.db.isInitialized) {
        await this.db.query('SELECT 1')
        dbOk = true
      }
    } catch { /* db not ready */ }

    return {
      status:    dbOk ? 'ok' : 'degraded',
      db:        dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    }
  }
}
