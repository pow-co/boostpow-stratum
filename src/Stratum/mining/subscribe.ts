import { Request } from '../request'
import { Response, BooleanResponse } from '../response'
import { SessionID } from '../sessionID'
import { message_id } from '../messageID'
import { method } from '../method'
import { error } from '../error'
import * as boostpow from 'boostpow-js'

export type subscribe_request = {
  id: message_id,
  method: method,
  params: [string] | [string, string]
}

export class SubscribeRequest extends Request {

  static valid(message: subscribe_request): boolean {
    if (!(Request.valid(message) && message['method'] === "mining.subscribe")) {
      return false
    }

    let params = message['params']
    return typeof params[0] === 'string' && (params.length === 1 || (params.length === 2 && SessionID.valid(params[1])))
  }

  static userAgent(message: subscribe_request): string {
    if (SubscribeRequest.valid(message)) {
      return message['params'][0]
    }

    throw "invalid subscribe request"
  }

  static extranonce1(message: subscribe_request): boostpow.UInt32Big {
    if (SubscribeRequest.valid(message)) {
      return UInt32Big.fromHex(message['params'][1])
    }

    throw "invalid subscribe response"
  }
}

export type subscribe_response = {
  id: message_id,
  params: [[string, string][]. string, number]
}

export class SubscribeResponse extends Response {

  static valid(message: subscribe_response): boolean {
    if (!(Request.valid(message)) {
      return false
    }

    let result = message['result']
    if (!(Array.isArray(result) && result.length === 3 && Array.isArray(result[0]) &&
      SessionID.valid(result[1]) && Number.isInteger(result[2]) && result[2] > 0)) {
      return false
    }

    for (subscription of result[0]) {
      if (!(Array.isArray(subscription) && subscription.length === 2 && Method.valid(subscription[0]) && typeof subscription[1] === 'string')) {
        return false
      }
    }

    return true
  }

  static subscriptions(message: subscribe_response): [string, string][] {
    if (SubscribeRequest.valid(message)) {
      return UInt32Big.fromHex(message['result'][0])
    }

    throw "invalid subscribe response"
  }

  static extranonce1(message: subscribe_request): boostpow.UInt32Big {
    if (SubscribeRequest.valid(message)) {
      return UInt32Big.fromHex(message['result'][1])
    }

    throw "invalid subscribe response"
  }

  static extranonce2size(message: set_extranonce): number {
    if (SetExtranonce.valid(message)) {
      return message['result'][2]
    }

    throw "invalid set_extranonce"
  }
}
