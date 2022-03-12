import { Request } from '../request'
import { Response, BooleanResponse } from '../response'
import { message_id } from '../messageID'
import { method } from '../method'
import { error } from '../error'
import * as boostpow from 'boostpow-js'

export type share = [string, string, string, string, string] |
  [string, string, string, string, string, string]

export type submit_request = {
  id: message_id,
  method: method,
  params: share
}

export class SubmitRequest extends Request {

  static valid(message: submit_request): bool {
    if (!(Request.valid(message) && message['method'] === "mining.submit")) {
      return false
    }

    let params = message['params']
    return typeof params[0] === 'string' && SessionID.valid(params[1]) &&
      SessionID.valid(params[2]) && SessionID.valid(params[3]) &&
      typeof params[4] === 'string' &&
      /^(([0-9a-f][0-9a-f])*)|(([0-9A-F][0-9A-F])*)$/.test(params[4]) &&
      (params.length === 5 ||
        (params.length === 6 && SessionID.valid(params[5]))
  }

  static workerName(message: submit_request): string {
    if (valid(message)) {
      return message['params'][0]
    }

    throw "invalid submit request"
  }

  static jobID(message: submit_request): string {
    if (valid(message)) {
      return message['params'][1]
    }

    throw "invalid submit request"
  }

  static timestamp(message: submit_request): boostpow.UInt32Little {
    if (valid(message)) {
      return message['params'][2]
    }

    throw "invalid submit request"
  }

  static nonce(message: submit_request): boostpow.UInt32Little {
    if (valid(message)) {
      return message['params'][3]
    }

    throw "invalid submit request"
  }

  static extranonce2(message: submit_request): boostpow.UInt32Big {
    if (valid(message)) {
      return message['params'][4]
    }

    throw "invalid submit request"
  }

  static version(message: submit_request): boostpow.Int32Little | undefined {
    if (valid(message)) {
      if (message['params'][5] === undefined) {
        return
      }

      return boostpow.Int32Little.fromHex(message['params'][5])
    }

    throw "invalid submit request"
  }
}

export type SubmitResponse = BooleanResponse
