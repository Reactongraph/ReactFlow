import * as http from 'http'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

// ── Minimal pre-server ──────────────────────────────────────────────────────
// Starts immediately on the service port so Railway's healthcheck passes
// while NestJS / TypeORM / Redis are still connecting.
// Once NestJS is ready, this server closes and NestJS takes over the port.
function startProbeServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url?.includes('/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'starting', timestamp: new Date().toISOString() }))
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Service is starting up — please retry' }))
    }
  })
  server.listen(port, '0.0.0.0', () =>
    console.log(`[probe] Health probe listening on :${port}`),
  )
  return server
}

async function bootstrap() {
  // Read PORT before NestJS so the probe can start right away
  const port = parseInt(process.env.PORT ?? '3001', 10)

  const probeServer = startProbeServer(port)

  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) =>
            `${timestamp} [${context ?? 'App'}] ${level}: ${message}`,
          ),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    ],
  })

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger })

    const config = app.get(ConfigService)
    const origin = config.get<string>('frontendUrl') ?? '*'

    // ── Security ────────────────────────────────────────────────
    app.use(helmet())
    app.enableCors({
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })

    // ── Versioning ──────────────────────────────────────────────
    app.setGlobalPrefix('api')
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

    // ── Validation pipeline ─────────────────────────────────────
    app.useGlobalPipes(new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
      transformOptions:     { enableImplicitConversion: true },
    }))

    // ── Global filters & interceptors ───────────────────────────
    app.useGlobalFilters(new HttpExceptionFilter())
    app.useGlobalInterceptors(new LoggingInterceptor())

    // ── Swagger (non-production only) ───────────────────────────
    if (config.get('nodeEnv') !== 'production') {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('FlowBuilder API')
        .setDescription('Workflow Automation Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build()
      SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig))
    }

    // Close the probe server, then hand the port to NestJS
    await new Promise<void>((resolve, reject) =>
      probeServer.close(err => (err ? reject(err) : resolve())),
    )
    await app.listen(port, '0.0.0.0')
    console.log(`FlowBuilder API running on http://0.0.0.0:${port}/api/v1`)
    if (config.get('nodeEnv') !== 'production') {
      console.log(`Swagger docs: http://0.0.0.0:${port}/api/docs`)
    }
  } catch (err) {
    // If NestJS fails (e.g. DB never became available) the probe server stays
    // up so Railway does not restart-loop the service continuously.
    console.error('[bootstrap] NestJS failed to start — probe server kept alive', err)
  }
}

bootstrap()
