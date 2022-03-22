
import { Event, Events } from './event'

import { log } from './log'

import * as net from 'net'

import * as uuid from 'uuid'

import { handleStratumMessage } from './stratum'

interface HostPort {
  ip: string;
  port: number;
}

export type Sessions = {
  [key: string]: Session
}

const sessions: Sessions = {}

type SessionId = string;

interface NewSession {
  socket: net.Socket;
}

export class Session {

  sessionId: SessionId;

  connectedAt: Date;

  socket: net.Socket;

  open: boolean;

  constructor({ socket }: NewSession) {

    this.connectedAt = new Date()

    this.sessionId = uuid.v4()

    this.socket = socket;

    this.open = true

    log.info('socket.connect', {

      remoteAddress: this.socket.remoteAddress,

      remotePort: this.socket.remotePort,

      sessionId: this.sessionId

    })

    this.socket.on('close', () => {

      log.info('socket.close', { sessionId: this.sessionId })

      delete sessions[this.sessionId]

      this.open = false
    })

    this.socket.on('error', (error) => {

      log.error('socket.error', { error, sessionId: this.sessionId })
    })

    this.socket.on('data', data => {

      handleStratumMessage(data, this.socket)

    })

  }
  disconnect() {

    this.socket.end();

  }

  toJSON() {

    return {

      remoteAddress: this.socket.remoteAddress,

      remotePort: this.socket.remotePort,

      sessionId: this.sessionId

    }
  }

}


export function startSession({socket}: NewSession): Session {

  let session = new Session({ socket })

  sessions[session.sessionId] = session

  return session

}

export async function listSessions(): Promise<Sessions> {

  return sessions

}

