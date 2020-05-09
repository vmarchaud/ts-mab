import { Publisher } from '../lib/publisher'
import { Redis } from 'ioredis'

declare global {
  namespace Express {
    export interface Request {
      publisher: Publisher,
      redis: Redis
    }
  }
}
