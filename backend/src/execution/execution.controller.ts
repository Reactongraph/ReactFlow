import {
  Controller, Post, Get, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ExecutionService } from './execution.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { User } from '../users/entities/user.entity'
import { IsOptional, IsObject } from 'class-validator'

class TriggerDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>
}

@ApiTags('execution')
@ApiBearerAuth()
@Controller({ path: 'workflows/:workflowId/runs', version: '1' })
export class ExecutionController {
  constructor(private readonly service: ExecutionService) {}

  @Post()
  @ApiOperation({ summary: 'Trigger a workflow run' })
  trigger(
    @Param('workflowId') workflowId: string,
    @CurrentUser() user: User,
    @Body() dto: TriggerDto,
  ) {
    return this.service.triggerRun({
      workflowId,
      userId:      user.id,
      triggerType: 'manual',
      triggerData: dto.data,
    })
  }

  @Get()
  @ApiOperation({ summary: 'List run history for a workflow' })
  listRuns(
    @Param('workflowId') workflowId: string,
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listRuns(workflowId, user.id, page, limit)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get execution statistics' })
  stats(@CurrentUser() user: User) {
    return this.service.getStats(user.id)
  }

  @Get(':runId')
  @ApiOperation({ summary: 'Get a specific run' })
  getRun(
    @Param('runId') runId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getRun(runId, user.id)
  }

  @Get(':runId/logs')
  @ApiOperation({ summary: 'Get execution logs for a run' })
  getLogs(
    @Param('runId') runId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getLogs(runId, user.id)
  }

  @Delete(':runId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a running/pending workflow run' })
  cancel(
    @Param('runId') runId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.cancelRun(runId, user.id)
  }
}
