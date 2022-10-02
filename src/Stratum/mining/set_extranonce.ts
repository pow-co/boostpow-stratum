import { JSONValue } from '../../json'
import { Notification } from '../notification'
import { method } from '../method'
import { SessionID } from '../sessionID'
import * as boostpow from 'boostpow'

export type extranonce = [string, number]

export class Extranonce  {

  static valid(x: extranonce) {
    return SessionID.valid(x[0]) && Number.isInteger(x[1]) && x[1] >= 0
  }

  static extranonce1(x: extranonce): boostpow.UInt32Big {
    if (Extranonce.valid(x)) {
      return boostpow.UInt32Big.fromHex(x[0])
    }

    throw "invalid extranonce"
  }

  static extranonce2size(x: extranonce): number {
    if (Extranonce.valid(x)) {
      return x[1]
    }

    throw "invalid extranonce"
  }

  static make(ex1: boostpow.UInt32Big, s: number): extranonce {
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
    if (message['method'] !== 'mining.set_extranonce') {
      return false
    }

    return this.valid_extranonce(message['params'])
  }

  static make(ex1: boostpow.UInt32Big, s: number): set_extranonce {
    return {id: null, method: 'mining.set_extranonce', params: Extranonce.make(ex1, s)}
  }

  static read(message: JSONValue): set_extranonce | undefined {
    let n = Notification.read(message)
    if (!!n && SetExtranonce.valid_extranonce(n.params)) return <set_extranonce>(n)
  }

}
