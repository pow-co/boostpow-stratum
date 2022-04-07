import { message_id, MessageID } from './messageID'
import { method } from './method'
import { error, Error } from './error'
import { JSONValue } from './message'

// A response is a reply to a request. 
export type response = {
  id: message_id,
  result: JSONValue,
  err: error
}

export class Response {
  static valid(message: response): boolean {
    return typeof message === 'object' && MessageID.valid(message['id']) &&
      message['result'] !== undefined && Error.valid(message['err'])
  }

  static id(message: response): message_id {
    if (Response.valid(message)) {
      return message['id']
    }

    throw "invalid response"
  }

  static method(message: response): method {
    if (Response.valid(message)) {
      return message['method']
    }

    throw "invalid response"
  }

  static result(message: response): JSONValue {
    if (Response.valid(message)) {
      return message['result']
    }

    throw "invalid response"
  }

  static error(message: response): error {
    if (Response.valid(message)) {
      return message['err']
    }

    throw "invalid response"
  }

  static is_error(message: response): boolean {
    return Response.error(message) !== null
  }

  static make(id: message_id, result: JSONValue, err?: error): response {
    if (err === undefined) {
      return {id: id, result: result, err: null}
    }

    return {id: id, result: result, err: err}
  }

}

export class BooleanResponse extends Response {
  static valid(message: response): boolean {
    return Response.valid(message) &&
      (typeof message['result'] === 'boolean' || Response.is_error(message))
  }

  static result(message: response): boolean | undefined {
    if (BooleanResponse.valid(message)) {
      if (typeof message['result'] === 'boolean') {
        return message['result']
      }
      return
    }

    throw "invalid response"
  }

  static make(id: message_id, result: boolean, err?: error): response {
    return Response.make(id, result, err)
  }

}
