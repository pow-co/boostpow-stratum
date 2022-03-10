
require('dotenv').config()

import { log } from './log'

import { initServer, server as api } from './api_server'

import { server as stratum } from './server'

export async function start() {

  log.info('main.start')

  await initServer()

  await api.start()

  await log.info('api.server.started', api.info);

  await stratum.start()

}

export async function stop(signal: string) {

  await log.info('process.exit', { signal })

  await stratum.stop()

  await api.stop()

  await log.info('api.server.stopped');

  process.exit(0)

}

if (require.main === module) {

  process.on('SIGTERM', () => stop('SIGTERM'))

  process.on('SIGINT', () => stop('SIGINT'))

  start()

}

