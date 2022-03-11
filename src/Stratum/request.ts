import { message_id, MessageID } from './messageID'
import { method } from './method'
import { JSONArray } from './message'

export type request = {
  id: message_id,
  method: method,
  params: JSONArray
}

export class Request {
  static valid(message: request): boolean {
    if (!(typeof message === 'object' && MessageID.valid(message['id']))) {
      return false
    }

    for (let x of message['params']) {
      if (x === undefined) return false
    }

    return true
  }

  static id(message: request): message_id {
    if (Request.valid(message)) {
      return message['id']
    }

    throw "invalid request"
  }

  static method(message: request): method {
    if (Request.valid(message)) {
      return message['method']
    }

    throw "invalid request"
  }

  static params(message: request): JSONArray {
    if (Request.valid(message)) {
      return message['params']
    }

    throw "invalid request"
  }
}
