
require('dotenv').config()

import { log } from './log'

import { server } from './api_server'

export async function start() {

  log.info('main.start')

  await server.start()

  log.info('api.server.started', server.info);

}

if (require.main === module) {

  start()

}
