
import { Event } from './event'
import { log } from './log'

let net = require('net');

interface HostPort {
  ip: string;
  port: number;
}

export class Session {
  hostPort: HostPort
  socket: net.Socket;

  constructor(hostPort: HostPort) {
    this.socket = new net.Socket();

    this.socket.on('close', function() {
      console.log('Connection closed');
    });

    this.socket.on('error', function(err) {
      console.error('Connection error: ' + err);
    });

    this.socket.connect(hostPort.port, hostPort.ip, function() {
    	console.log('Connection opened');
    });

  }

  get open(): boolean {
    return this.socket.readyState === this.socket.OPEN;
  }

  disconnect() {

    this.socket.disconnect();

  }

}
