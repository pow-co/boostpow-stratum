
import { Event, Events } from './event'
import * as net from 'net'

import { log } from './log'

export class Server {
  server;
  name: String;

  constructor(name: String, port: number, maxConnections: number) {
    this.name = name;

    this.server = net.createServer((socket) => {

      log.info('client.connect', {
        name: this.name,
        'ip': "I don't know how to get this information -- Daniel"
      })

      socket.on('data', (buffer) => {
        // TODO keep reading data unti we get a \n. Check that everything
        // up to the new line is a json message. Read that message.
      });

      socket.on('end', () => {

        log.info('client.disconnect', {
          name: this.name, 
          'ip': "I don't know how to get this information -- Daniel"
        })

      });
    });

    this.server.maxConnections = maxConnections;
    this.server.listen(port);

  }
}
