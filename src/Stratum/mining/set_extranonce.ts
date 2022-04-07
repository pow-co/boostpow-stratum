import { Notification } from '../notification'
import { method } from '../method'
import { SessionID } from '../sessionID'
import { UInt32Big } from 'boostpow'

export type extranonce = [string, number]

export class Extranonce  {

  static valid(x: extranonce) {
    return SessionID.valid(x[0]) && Number.isInteger(x[1]) && x[1] >= 0
  }

  static extranonce1(x: extranonce): UInt32Big {
    if (Extranonce.valid(x)) {
      return UInt32Big.fromHex(x[0])
    }

    throw "invalid extranonce"
  }

  static extranonce2size(x: extranonce): number {
    if (Extranonce.valid(x)) {
      return x[1]
    }

    throw "invalid extranonce"
  }

  static make(ex1: UInt32Big, s: number): extranonce {
    return [ex1.hex, s]
  }

}

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

  static make(ex1: UInt32Big, s: number): set_extranonce {
    return {id: null, method: 'mining.set_extranonce', params: Extranonce.make(ex1, s)}
  }

}
