
import { Event, Events } from './event'
import * as net from 'net'

export class Server {
  server;
  name: String;

  constructor(name: String, port: number, maxConnections: number) {
    this.name = name;

    this.server = net.createServer((socket) => {
      Events.log(new Event({
        'who': name,
        'what': 'new connection',
        'ip': "I don't know how to get this information -- Daniel"}));

      socket.on('data', (buffer) => {
        // TODO keep reading data unti we get a \n. Check that everything
        // up to the new line is a json message. Read that message.
      });

      socket.on('end', () => {
        Events.log(new Event({
          'who': name,
          'what': 'connection closed',
          'ip': "I don't know how to get this information -- Daniel"}))
      });
    });

    this.server.maxConnections = maxConnections;
    this.server.listen(port);

  }
}
