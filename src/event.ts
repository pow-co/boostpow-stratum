
import { Client } from './client'

export class Event {

  get(key: string): any {

    return ''

  }

}

export async function listEvents(params: any = {}): Promise<Event[]> {

  return [

    new Event(),

    new Event()

  ]

}

export async function listEventsForClient(client: Client, params: any = {}): Promise<Event[]>  {

  return [

    new Event()

  ]

}

