import {
  Controller, Get, Post, Put, Delete, Param, Body, Req,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsIn } from 'class-validator'
import { Request } from 'express'
import { CredentialsService } from './credentials.service'
import { CredentialType } from './entities/credential.entity'

class CreateCredentialDto {
  @IsString() name: string
  @IsIn(['openai','slack','google','stripe','smtp','http','custom'])
  type: CredentialType
  data: Record<string, unknown>
  @IsOptional() @IsString() description?: string
}

@ApiTags('credentials')
@ApiBearerAuth()
@Controller({ path: 'credentials', version: '1' })
export class CredentialsController {
  constructor(private readonly svc: CredentialsService) {}

  @Post()
  create(@Body() dto: CreateCredentialDto, @Req() req: Request & { user: { id: string } }) {
    return this.svc.create(req.user.id, dto.name, dto.type, dto.data, dto.description)
  }

  @Get()
  list(@Req() req: Request & { user: { id: string } }) {
    return this.svc.list(req.user.id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { data: Record<string, unknown>; name?: string; description?: string },
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.svc.update(id, req.user.id, body.data, body.name, body.description)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user: { id: string } }) {
    return this.svc.delete(id, req.user.id)
  }
}
