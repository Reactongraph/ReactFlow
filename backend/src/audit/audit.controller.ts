import { Controller, Get, Query, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { AuditService } from './audit.service'
import { AuditAction } from './entities/audit-log.entity'

@ApiTags('audit')
@ApiBearerAuth()
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  query(
    @Query('action')   action?: AuditAction,
    @Query('from')     from?: string,
    @Query('to')       to?: string,
    @Query('limit')    limit?: string,
    @Query('offset')   offset?: string,
    @Req() req?: Request & { user?: { id: string } },
  ) {
    return this.svc.query({
      userId:   req?.user?.id,
      action,
      fromDate: from   ? new Date(from)         : undefined,
      toDate:   to     ? new Date(to)           : undefined,
      limit:    limit  ? parseInt(limit,  10)   : undefined,
      offset:   offset ? parseInt(offset, 10)   : undefined,
    })
  }
}
