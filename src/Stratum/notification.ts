import { method } from './method'
import { parameters } from './message'
import { JSONValue } from '../json'

// a notification is like a request but with no response expected.
export type notification = {
  id: null,
  method: method,
  params: parameters
}

export class Notification {

  static read(message: JSONValue): notification | undefined {
    if (!(typeof message === 'object' && message['id'] === null &&
      typeof message['method'] === 'string' &&
      Array.isArray(message['params']))) return

    for (let x of message['params']) {
      if (x === undefined) return
    }

    return <notification>message
  }

  static method(message: notification): method {
    return message['method']
  }

  static params(message: notification): parameters {
    return message['params']
  }
}
