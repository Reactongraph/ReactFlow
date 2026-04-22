import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { MonitoringService } from './monitoring.service'

@ApiTags('monitoring')
@ApiBearerAuth()
@Controller({ path: 'monitoring', version: '1' })
export class MonitoringController {
  constructor(private readonly svc: MonitoringService) {}

  @Get('metrics')
  getMetrics() {
    return this.svc.getPlatformMetrics()
  }
}
