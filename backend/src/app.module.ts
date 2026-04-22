import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { BullModule } from '@nestjs/bull'
import configuration from './config/configuration'
import { AuthModule }       from './auth/auth.module'
import { UsersModule }      from './users/users.module'
import { WorkflowsModule }  from './workflows/workflows.module'
import { ExecutionModule }  from './execution/execution.module'
import { NodesModule }      from './nodes/nodes.module'
import { QueueModule }      from './queue/queue.module'
import { SchedulerModule }  from './scheduler/scheduler.module'
import { WebsocketModule }  from './websocket/websocket.module'
import { StorageModule }    from './storage/storage.module'
import { MonitoringModule }  from './monitoring/monitoring.module'
import { HealthController }  from './health.controller'

@Module({
  controllers: [HealthController],
  imports: [
    // ── Config ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal:   true,
      load:       [configuration],
      envFilePath: '.env',
    }),

    // ── Database ──────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const isProd = cfg.get('nodeEnv') === 'production'
        const dbUrl  = cfg.get<string | undefined>('database.url')
        const base = {
          type:        'postgres' as const,
          entities:    [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProd,
          logging:     !isProd,
          ssl:         isProd ? { rejectUnauthorized: false } : false,
        }
        // Use connection URL when available (Railway injects DATABASE_URL)
        if (dbUrl) return { ...base, url: dbUrl } as TypeOrmModuleOptions
        return {
          ...base,
          host:     cfg.get<string>('database.host')!,
          port:     cfg.get<number>('database.port')!,
          username: cfg.get<string>('database.username')!,
          password: cfg.get<string>('database.password')!,
          database: cfg.get<string>('database.name')!,
        } as TypeOrmModuleOptions
      },
    }),

    // ── Rate Limiting ─────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ([{
        ttl:   cfg.get<number>('throttle.ttl')   ?? 60,
        limit: cfg.get<number>('throttle.limit') ?? 100,
      }]),
    }),

    // ── Background Jobs ───────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const redisUrl = cfg.get<string | undefined>('redis.url')
        return redisUrl
          ? { url: redisUrl }
          : {
              redis: {
                host:     cfg.get('redis.host'),
                port:     cfg.get<number>('redis.port'),
                password: cfg.get('redis.password'),
              },
            }
      },
    }),

    // ── Cron Scheduling ───────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature Modules ───────────────────────────────────────
    AuthModule,
    UsersModule,
    WorkflowsModule,
    ExecutionModule,
    NodesModule,
    QueueModule,
    SchedulerModule,
    WebsocketModule,
    StorageModule,
    MonitoringModule,
  ],
})
export class AppModule {}
