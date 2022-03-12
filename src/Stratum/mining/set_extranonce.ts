import { Notification } from '../notification'
import { method } from '../method'
import { SessionID } from '../sessionID'
import * as boostpow from 'boostpow-js'

export type set_extranonce = {
  id: null,
  method: method,
  params: [string, number]
}

export class SetExtranonce extends Notification {

  static valid(message: set_extranonce): boolean {
    if (!(Notification.valid(message) && message['method'] === "mining.set_extranonce")) {
      return false
    }

    let params = message['params']
    return params.length === 2 && typeof params[0] === 'string' &&
      SessionID.valid(params[0]) && Number.isInteger(params[1]) && params[1] > 0
  }

  static extranonce1(message: set_extranonce): boostpow.Int32Little {
    if (SetExtranonce.valid(message)) {
      return boostpow.Int32Little.fromHex(message['params'][0])
    }

    throw "invalid set_extranonce"
  }

  static extranonce2size(message: set_extranonce): number {
    if (SetExtranonce.valid(message)) {
      return message['params'][1]
    }

    throw "invalid set_extranonce"
  }

}
