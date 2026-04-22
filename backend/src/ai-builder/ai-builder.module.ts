import { Module } from '@nestjs/common'
import { AiBuilderService } from './ai-builder.service'
import { AiBuilderController } from './ai-builder.controller'

@Module({
  controllers: [AiBuilderController],
  providers: [AiBuilderService],
  exports: [AiBuilderService],
})
export class AiBuilderModule {}
