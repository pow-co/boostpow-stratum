import { Notification } from '../notification'
import { method } from '../method'

export type show_message = {
  id: null,
  method: method,
  params: [string]
}

export class ShowMessage extends Notification {

  static valid(m: show_message): boolean {
    return m['method'] === 'client.show_message' 
  }

  static message(m: show_message): string {
    if (ShowMessage.valid(m)) return m['params'][0]

    throw "invalid show_message"
  }

  static make(message: string): show_message {
    return {id: null, method: 'client.show_message', params: [message]}
  }

}
