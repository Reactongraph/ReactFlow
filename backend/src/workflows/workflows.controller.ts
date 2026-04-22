import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { WorkflowsService } from './workflows.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { User } from '../users/entities/user.entity'
import {
  CreateWorkflowDto, UpdateWorkflowDto, SaveVersionDto, WorkflowQueryDto,
} from './dto/workflow.dto'

@ApiTags('workflows')
@ApiBearerAuth()
@Controller({ path: 'workflows', version: '1' })
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkflowDto) {
    return this.service.create(user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: 'List all workflows for current user' })
  findAll(@CurrentUser() user: User, @Query() query: WorkflowQueryDto) {
    return this.service.findAll(user.id, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a workflow (full replace nodes/edges)' })
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateWorkflowDto) {
    return this.service.update(id, user.id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workflow' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user.id)
  }

  // ── Versions ────────────────────────────────────────────────────

  @Post(':id/versions')
  @ApiOperation({ summary: 'Save a named version snapshot' })
  saveVersion(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: SaveVersionDto) {
    return this.service.saveVersion(id, user.id, dto)
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List versions for a workflow' })
  listVersions(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.listVersions(id, user.id)
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a workflow to a saved version' })
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.restoreVersion(id, versionId, user.id)
  }

  @Delete(':id/versions/:versionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a version' })
  deleteVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.deleteVersion(id, versionId, user.id)
  }
}
