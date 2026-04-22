/**
 * Supports both individual env vars (local dev) and
 * Railway's DATABASE_URL / REDIS_URL connection strings.
 */

function parseDbUrl(url: string) {
  try {
    const u = new URL(url)
    return {
      host:     u.hostname,
      port:     parseInt(u.port || '5432', 10),
      username: u.username,
      password: u.password,
      name:     u.pathname.replace(/^\//, ''),
    }
  } catch {
    return null
  }
}

function parseRedisUrl(url: string) {
  try {
    const u = new URL(url)
    return {
      host:     u.hostname,
      port:     parseInt(u.port || '6379', 10),
      password: u.password || undefined,
    }
  } catch {
    return null
  }
}

export default () => {
  // ── Database ────────────────────────────────────────────────
  const dbFromUrl = process.env.DATABASE_URL
    ? parseDbUrl(process.env.DATABASE_URL)
    : null

  const database = {
    host:     dbFromUrl?.host     ?? process.env.DB_HOST     ?? 'localhost',
    port:     dbFromUrl?.port     ?? parseInt(process.env.DB_PORT ?? '5432', 10),
    username: dbFromUrl?.username ?? process.env.DB_USERNAME ?? 'postgres',
    password: dbFromUrl?.password ?? process.env.DB_PASSWORD ?? 'postgres',
    name:     dbFromUrl?.name     ?? process.env.DB_NAME     ?? 'flowbuilder',
    url:      process.env.DATABASE_URL,
  }

  // ── Redis ────────────────────────────────────────────────────
  const redisFromUrl = process.env.REDIS_URL
    ? parseRedisUrl(process.env.REDIS_URL)
    : null

  const redis = {
    host:     redisFromUrl?.host     ?? process.env.REDIS_HOST     ?? 'localhost',
    port:     redisFromUrl?.port     ?? parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: redisFromUrl?.password ?? process.env.REDIS_PASSWORD ?? undefined,
    url:      process.env.REDIS_URL,
  }

  return {
    port:       parseInt(process.env.PORT ?? '3001', 10),
    nodeEnv:    process.env.NODE_ENV ?? 'development',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

    database,
    redis,

    jwt: {
      secret:         process.env.JWT_SECRET          ?? 'dev-secret-change-in-prod',
      expiresIn:      process.env.JWT_EXPIRES_IN       ?? '15m',
      refreshSecret:  process.env.JWT_REFRESH_SECRET   ?? 'dev-refresh-change-in-prod',
      refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
    },

    smtp: {
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.SMTP_FROM ?? 'FlowBuilder <noreply@flowbuilder.io>',
    },

    storage: {
      driver:    process.env.STORAGE_DRIVER     ?? 'local',
      localPath: process.env.STORAGE_LOCAL_PATH ?? './uploads',
    },

    throttle: {
      ttl:   parseInt(process.env.THROTTLE_TTL   ?? '60',  10),
      limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    },
  }
}
