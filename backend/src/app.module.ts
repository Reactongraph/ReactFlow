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
import { WebhooksModule }    from './webhooks/webhooks.module'
import { CredentialsModule } from './credentials/credentials.module'
import { AuditModule }       from './audit/audit.module'
import { AiBuilderModule }   from './ai-builder/ai-builder.module'
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
          type:          'postgres' as const,
          entities:      [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize:   true,
          logging:       !isProd,
          ssl:           isProd ? { rejectUnauthorized: false } : false,
          // Retry so Railway Postgres service has time to start
          retryAttempts: 10,
          retryDelay:    3_000,
          // Prevent pg from hanging indefinitely on a bad host
          extra: { connectionTimeoutMillis: 5_000, idleTimeoutMillis: 30_000 },
        }
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
        const redisOptions = redisUrl
          ? { url: redisUrl }
          : {
              host:     cfg.get<string>('redis.host')     ?? 'localhost',
              port:     cfg.get<number>('redis.port')     ?? 6379,
              password: cfg.get<string>('redis.password') ?? undefined,
            }
        // Bull validates that every ioredis client it receives has
        // enableReadyCheck=false AND maxRetriesPerRequest=null, otherwise
        // it throws MISSING_REDIS_OPTS for the bclient/subscriber connections.
        // We also attach an error listener so connection errors are logged
        // instead of becoming unhandled rejections that crash the process.
        const makeRedisClient = () => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const IORedis = require('ioredis')
          const ioOpts = {
            enableReadyCheck:     false, // required by Bull for bclient/subscriber
            maxRetriesPerRequest: null,  // required by Bull for bclient/subscriber
            enableOfflineQueue:   true,
          }
          const client = redisUrl
            ? new IORedis(redisUrl, ioOpts)
            : new IORedis({ host: redisOptions.host, port: redisOptions.port, password: redisOptions.password, ...ioOpts })
          client.on('error', (err: Error) => console.error(`[Redis] ${err.message}`))
          return client
        }
        return { createClient: () => makeRedisClient() }
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
    WebhooksModule,
    CredentialsModule,
    AuditModule,
    AiBuilderModule,
  ],
})
export class AppModule {}
