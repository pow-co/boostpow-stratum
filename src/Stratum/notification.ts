import { method } from './method'
import { JSONArray } from './message'

export type notification = {
  id: null,
  method: method,
  params: JSONArray
}

export class Notification {
  static valid(message): boolean {
    if (!(typeof message === 'object' && message['id'] === null &&
      typeof message['method'] === 'string')) {
      return false
    }

    for (let x of message['params']) {
      if (x === undefined) return false
    }

    return true
  }

  static method(message): method {
    if (Notification.valid(message)) {
      return message['method']
    }

    throw "invalid notification"
  }

  static params(message): JSONArray {
    if (Notification.valid(message)) {
      return message['params']
    }

    throw "invalid notification"
  }
}
