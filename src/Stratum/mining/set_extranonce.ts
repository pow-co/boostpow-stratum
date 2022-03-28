import { Notification } from '../notification'
import { method } from '../method'
import { SessionID } from '../sessionID'
import * as boostpow from 'boostpow'

export type extranonce = [string, number]

export type set_extranonce = {
  id: null,
  method: method,
  params: extranonce
}

export class SetExtranonce extends Notification {

  static valid_extranonce(x: extranonce) {
    return SessionID.valid(x[0]) && Number.isInteger(x[1]) && x[1] >= 0
  }

  static valid(message: set_extranonce): boolean {
    if (!(Notification.valid(message) && message['method'] === 'mining.set_extranonce')) {
      return false
    }

    return this.valid_extranonce(message['params'])
  }

  static extranonce1(message: set_extranonce): boostpow.UInt32Big {
    if (SetExtranonce.valid(message)) {
      return boostpow.UInt32Big.fromHex(message['params'][0])
    }

    throw "invalid set_extranonce"
  }

  static extranonce2size(message: set_extranonce): number {
    if (SetExtranonce.valid(message)) {
      return message['params'][1]
    }

    throw "invalid set_extranonce"
  }

  static make(ex1: boostpow.UInt32Big, s: number): set_extranonce {
    return {id: null, method: 'mining.set_extranonce', params: [ex1.hex, s]}
  }

}
