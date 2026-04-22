import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'
import { AiBuilderService } from './ai-builder.service'

class GenerateWorkflowDto {
  @IsString()
  @MinLength(10)
  prompt: string
}

@ApiTags('ai-builder')
@ApiBearerAuth()
@Controller({ path: 'ai-builder', version: '1' })
export class AiBuilderController {
  constructor(private readonly svc: AiBuilderService) {}

  @Post('generate')
  generate(@Body() dto: GenerateWorkflowDto) {
    return this.svc.generateWorkflow(dto.prompt)
  }
}
