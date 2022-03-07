
import { Event } from './event'
import { Log } from './log'

var net = require('net');

interface HostPort {
  ip: string;
  port: number;
}

export class Session {
  hostPort: HostPort
  socket: net.Socket;

  constructor(hostPort: HostPort) {
    this.client = new net.Socket();

    client.on('close', function() {
      console.log('Connection closed');
    });

    client.on('error', function(err) {
      console.error('Connection error: ' + err);
    });

    client.connect(hostPort.port, hostPort.ip, function() {
    	console.log('Connection opened');
    });

  }

  get open(): bool {
    return socket.readyState === socket.OPEN;
  }

  disconnect(server: Server) {

    this.socket.disconnect();

  }

}
