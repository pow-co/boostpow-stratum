import { Notification } from '../notification'
import { SessionID } from '../sessionID'
import { method } from '../method'
import * as boostpow from 'boostpow'

export type set_version_mask = {
  id: null,
  method: method,
  params: [string]
}

export class SetVersionMask extends Notification {

  static valid(message: set_version_mask): boolean {
    if (message['method'] !== 'mining.set_version_mask') {
      return false
    }

    let params = message['params']
    return params.length === 1 && SessionID.valid(params[0])
  }

  static version_mask(message: set_version_mask): boostpow.Int32Little {
    if (SetVersionMask.valid(message)) return boostpow.Int32Little.fromHex(message['params'][0])
  }

  static make(mask: boostpow.Int32Little): set_version_mask {
    return {id: null, method: 'mining.set_version_mask', params: [mask.hex]}
  }

}
