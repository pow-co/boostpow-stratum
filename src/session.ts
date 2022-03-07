
import { Events } from './event'
import { log } from './log'
import * as net from 'net'

//let net = require('net');

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

    this.socket.on('close', () => {
      this.socket.end();
    })

    this.socket.connect(hostPort.port, hostPort.ip, function() {
    	console.log('Connection opened');
    });

  }

  // TODO I couldn't figure out how to do this one -- Daniel
  get open(): boolean {
    return true
  }

  disconnect() {

    this.socket.end();

  }

}
