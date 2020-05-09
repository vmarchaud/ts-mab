import 'express-async-errors'

import express from 'express'
import bodyParser from 'body-parser'
import { createTerminus } from '@godaddy/terminus'
import settings from '../config'
import http from 'http'
import logger from './lib/logger'
import cors from 'cors'
import { BanditManager } from './bandits/manager'
import { BanditStoreType } from './bandits/store/types'
import * as url from 'url'
import { BanditType } from './bandits/types'

export async function startup () {
  // setup bandit manager
  const redisUrl = url.parse(settings.REDIS_URI)
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {
        host: redisUrl.host ?? 'localhost',
        port: parseInt(redisUrl.port ?? '6379', 10)
      }
    },
    banditType: BanditType.THOMPSON
  })
  await manager.init()

  // Setup app
  const app = express()
  app.disable('x-powered-by')
  app.use(cors())

  app.use(bodyParser.json({
    limit: '1mb',
    // always try the request as json
    type: (req) => true
  }))

  // attach the publisher in the request
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.manager = manager
    return next()
  })

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      if (typeof err.message === 'object') {
        err.message = err.message.msg
      }
      const body = req.body ?? {}
      logger.warn('Error in express routes', {
        error: err,
        key: body.key,
        url: body.url,
        status: err.status ?? err.statusCode ?? res.statusCode ?? 500
      })
    }
    return next()
  })

  return app
}

if (require.main === module) {
  const port = settings.PORT
  // tslint:disable-next-line: no-floating-promises
  startup()
  .then(app => {
    const server = http.createServer(app)
    createTerminus(server, {
      healthChecks: {
        '/health': async () => {
          return 'OK'
        }
      }
    })
    server.on('error', err => Promise.reject(err))
    server.listen(parseInt(port, 10), () => logger.info(`Tracker ingester started on port ${port}`))
  }).catch(err => {
    logger.fatal(err)
    return process.exit(1)
  })
}
