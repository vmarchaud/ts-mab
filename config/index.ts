
export = {
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  PORT: process.env.PORT ?? '8000',
  REDIS_URI: process.env.REDIS_URI ?? 'redis://localhost'
}
