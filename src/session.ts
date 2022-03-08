
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

    this.socket.on('close', function() {
      Events.log(new Event({
        'who': name,
        'what': 'connection successful'}))
    })

    this.socket.on('error', (err: string) => {
      Events.log(new Event({
        'who': name,
        'what': 'error: ' + err}))
    })

    this.socket.on('close', () => {
      Events.log(new Event({
        'who': name,
        'what': 'connection.disconnect'}))
      this.socket.end();
    })

    this.socket.connect(hostPort.port, hostPort.ip, function() {
      Events.log(new Event({
        'who': name,
        'what': 'client.connect',
        'ip': hostPort.ip,
        'port': hostPort.port}))
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
