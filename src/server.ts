
import * as net from 'net'
import { Session } from './session'
import { stratum } from './stratum'
import { server_session } from './server_session'
import { log } from './log'
import { listJobs } from './powco'
import { JobManager, job_manager } from './jobs'
import { wallet } from './bitcoin'

interface NewServer {
  name: string;
  port: number;
  maxConnections?: number;
}

export class Server {
  server;
  name: String;
  port: number;
  jobs: JobManager

  constructor({name, port, maxConnections}: NewServer) {

    this.name = name;

    this.server = net.createServer(socket => {

      // this session is not immediately deleted because it adds itself
      // to a global object called sessions containing all sessions.
      new Session({ socket }, stratum(server_session(this.jobs.subscribe, true)))

    })

    this.port = port;

    this.server.maxConnections = maxConnections;

  }

  start(jobs: JobManager) {
    this.jobs = jobs

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

async function startServer(w: wallet) {

  server.start(job_manager(await listJobs(), w, 10))

  log.info('stratum.server.started', server.server.info);
}
/*
if (require.main === module) {

  startServer()

}*/
