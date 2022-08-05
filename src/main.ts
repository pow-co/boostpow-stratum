require('dotenv').config()
import * as bsv from 'bsv'
import {powco_network, private_key_wallet} from './bitcoin'

// Include process module
const process = require('process');

import { log } from './log'

import { initServer, server as api } from './api_server'

import { server as stratum } from './server'

import { listJobs } from './powco'

import { job_manager } from './jobs'

export async function start() {

  // Printing process.argv property value
  var args = process.argv;

  let key

  if (process.env.PRIVATE_KEY_WIF) {

    key = new bsv.PrivKey().fromWif(process.env.PRIVATE_KEY_WIF)

  } else if (args.length !== 3) {
    console.log("expecting one argument; " + (args.length - 2) + " provided.")
    console.log("the first argument should be a WIF private key that will be used as a wallet.")
    console.log("alternatively use the PRIVATE_KEY_WIF environment variable.")
    return
  } else {
    try {
      key = new bsv.PrivKey().fromWif(args[2])
    } catch (er) {
      console.log("could not read WIF: " + er.name + ", " + er.message)
      return
    }
  }

  try {
    key.validate()
  } catch (er) {
    console.log("Key is invalid: " + er.name + ", " + er.message)
    return
  }

  log.info('main.start')

  await initServer()

  await api.start()

  await log.info('api.server.started', api.info);

  await stratum.start(job_manager(await listJobs(), private_key_wallet(key),powco_network(), 10))

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
