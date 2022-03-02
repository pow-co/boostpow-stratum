
import { Server } from './server'

import { Event } from './event'

interface NewClient {
  ip: string;
}

export class Client {

  ip: string;

  constructor(params: NewClient) {

    this.ip = params.ip;

  }

  async connect(server: Server): Promise<Event> {

    return new Event()

  }
 
  async disconnect(server: Server): Promise<Event> {

    return new Event()

  }

  async sendTo(server: Server, message: any): Promise<Event> {

    return new Event()

  }

}

