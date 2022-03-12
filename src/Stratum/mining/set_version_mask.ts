import { Notification } from '../notification'
import { SessionID } from '../sessionID'
import { method } from '../method'
import * as boostpow from 'boostpow-js'

export type set_version_mask = {
  id: null,
  method: method,
  params: [string]
}

export class SetVersionMask extends Notification {

  static valid(message: set_version_mask): boolean {
    if (!(Notification.valid(message) && message['method'] === "mining.set_version_mask")) {
      return false
    }

    let params = message['params']
    return params.length === 1 && SessionID.valid(params[0])
  }

  static version_mask(message: set_version_mask): boostpow.Int32Little {
    if (SetVersionMask.valid(message)) return Int32Little.fromHex(message['params'][0])
  }

}
