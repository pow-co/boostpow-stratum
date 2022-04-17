
import { Event, Events } from './event'
import * as net from 'net'

import { asOptional, asNumber } from 'cleaners'

import { Session } from './session'

import { handlers, handleStratumMessage } from './stratum'

import { log } from './log'

interface NewServer {
  name: string;
  port: number;
  maxConnections?: number;
}

export class Server {
  server;
  name: String;
  port: number;

  constructor({name, port, maxConnections}: NewServer) {

    this.name = name;

    this.server = net.createServer(socket => {

      // this session is not immediately deleted because it adds itself
      // to a global object called sessions containing all sessions.
      new Session({ socket }, handleStratumMessage(handlers))

    })

    this.port = port;

    this.server.maxConnections = maxConnections;

  }

  start() {

    this.server.listen(this.port)

    log.info('stratum.server.started', {

      name: this.name,

      port: this.port,

      maxConnections: this.server.maxConnections

    })

  }

  stop() {

    return new Promise(resolve => {

      this.server.close((result) => {

        log.info('stratum.server.stopped')

        resolve(result)

      })

    })

  }
}

const port = process.env.STRATUM_PORT ?
    parseInt(process.env.STRATUM_PORT) :
    5200

export const server = new Server({

  port,

  name: 'stratum.v0'

})

if (require.main === module) {

  server.start()

  log.info('stratum.server.started', server.server.info);

}
