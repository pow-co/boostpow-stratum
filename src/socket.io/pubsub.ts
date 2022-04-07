
import { Socket } from 'socket.io'

import { authenticate } from './auth'

import { sockets } from './sockets'

export async function subscribe(socket: Socket) {

  sockets[socket.sessionId] = socket

}

export async function unsubscribe(socket: Socket) {

  delete sockets[socket.sessionId]

}

export async function broadcast(event: string, payload: any) {

  Object.values(sockets).forEach(socket => {

    socket.send(payload)

  })

}
