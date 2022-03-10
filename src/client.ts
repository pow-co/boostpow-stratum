
import { Socket } from 'net'

import { log } from './log'

class Client {

  socket: Socket;

  constructor(socket) {

    this.socket = socket

  }

}

interface Connect {
  host: string;
  port: number;
}

export async function connect({host, port}: Connect): Promise<Socket> {

  return new Promise((resolve, reject) => {

    let socket = new Socket()

    socket.connect(port, host, () => {

      resolve(socket)

    })

  })

}

