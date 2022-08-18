require('dotenv').config()
import * as bsv from 'bsv'
import * as boostpow from 'boostpow'
import {powco_network, private_key_wallet} from './bitcoin'

// Include process module
const process = require('process');

import { log } from './log'

import { initServer, server as api } from './api_server'

import { server as stratum } from './server'

import { listJobs } from './powco'

import { job_manager } from './jobs'

import { test_job_manager } from './jobs_test'

export async function start() {

  log.info('main.start')

  //await initServer()

  //await api.start()

  //await log.info('api.server.started', api.info);

  let jobs = test_job_manager();

  await log.info('powco.listening', api.info);

  await stratum.start(jobs)

  await log.info('stratum.server.started', api.info);

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
