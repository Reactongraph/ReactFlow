import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Webhook } from './entities/webhook.entity'
import { WebhooksService } from './webhooks.service'
import { WebhooksController } from './webhooks.controller'
import { ExecutionModule } from '../execution/execution.module'

@Module({
  imports: [TypeOrmModule.forFeature([Webhook]), ExecutionModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
