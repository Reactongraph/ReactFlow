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

async function bootstrap() {
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

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger })

  const config = app.get(ConfigService)
  const port   = config.get<number>('port') ?? 3001
  const origin = config.get<string>('frontendUrl') ?? '*'
console.log('Config values:', { port, origin })
  // ── Security ──────────────────────────────────────────────────
  app.use(helmet())
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // ── Versioning ────────────────────────────────────────────────
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  // ── Validation pipeline ───────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist:        true,
    forbidNonWhitelisted: true,
    transform:        true,
    transformOptions: { enableImplicitConversion: true },
  }))

  // ── Global filters & interceptors ─────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())

  // ── Swagger ───────────────────────────────────────────────────
  if (config.get('nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FlowBuilder API')
      .setDescription('Workflow Automation Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }

  await app.listen(port)
  console.log(`FlowBuilder API running on http://localhost:${port}/api/v1`)
  console.log(`Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
