
import { Event, Events } from './event'
import { log } from './log'
import * as net from 'net'

//let net = require('net');

interface HostPort {
  ip: string;
  port: number;
}

export class Session {
  name: string
  hostPort: HostPort
  socket: net.Socket

  constructor(name: string, hostPort: HostPort) {
    this.name = name;
    this.hostPort = hostPort;
    this.socket = new net.Socket();

    this.socket.on('close', () => {

      log.info('connected.successful', { name: this.name })

    })

    this.socket.on('error', (error) => {

      log.error('socket.error', { error })
    })

    this.socket.on('close', () => {

      log.info('connection.disconnect', {

        name: this.name

      })

    })

    this.socket.connect(hostPort.port, hostPort.ip, () => {

      log.info('client.connect', {
        ip: hostPort.ip,
        port: hostPort.port,
        name: this.name
      })

    })

  }

  // TODO I couldn't figure out how to do this one -- Daniel
  get open(): boolean {
    return true
  }

  disconnect() {

    this.socket.end();

  }

}

interface SessionData {

}

export async function listSessions(): Promise<SessionData[]> {

  // TODO: Daniel please make this return a list of sessions

  return []

}

