import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { WorkflowGateway } from './workflow.gateway'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('jwt.secret'),
      }),
    }),
  ],
  providers: [WorkflowGateway],
  exports:   [WorkflowGateway],
})
export class WebsocketModule {}
