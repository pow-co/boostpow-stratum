#!/usr/bin/env ts-node

import { program } from 'commander'

import { createHash } from 'crypto'

import * as uuid from 'uuid'

import { log } from '../log'

import { connect } from '../client'

import { Socket } from 'net'

import { connectClient } from '../socket.io/client'

program
  .command('connect [host] [port] [path]')
  .action(async (host='localhost', port=5200, path='/v1/socketio') => {

    try {

      await log.info('bin.client.connect', { host, port })

      let socket: Socket = await connect({host, port})

      log.info('bin.client.connected', { port, host })

      const challenge = createHash('sha256').update(uuid.v4()).digest('hex');

      //socket.write(JSON.stringify({ challenge }))

    } catch(error) {

      log.error('bin.client.connect.error', { error })

    }

  })

program.parse(process.argv)
