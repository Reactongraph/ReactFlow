import {
  Controller, Post, Get, Delete, Param, Body, Req, HttpCode,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { WebhooksService } from './webhooks.service'
import { Public } from '../auth/guards/jwt-auth.guard'

@ApiTags('webhooks')
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}

  // ── Authenticated: manage webhook registrations ───────────────
  @ApiBearerAuth()
  @Post('workflows/:workflowId')
  create(
    @Param('workflowId') workflowId: string,
    @Body('description') description: string | undefined,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.svc.create(workflowId, req.user.id, description)
  }

  @ApiBearerAuth()
  @Get('workflows/:workflowId')
  list(
    @Param('workflowId') workflowId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.svc.listForWorkflow(workflowId, req.user.id)
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.svc.delete(id, req.user.id)
  }

  // ── Public: receive webhook payloads ─────────────────────────
  @Public()
  @Post('trigger/:token')
  @HttpCode(202)
  trigger(
    @Param('token') token: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.svc.trigger(token, body)
  }
}
