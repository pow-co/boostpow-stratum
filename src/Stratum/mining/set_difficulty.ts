import { Notification } from '../notification'
import { method } from '../method'
import { JSONValue } from '../../json'
import * as boostpow from 'boostpow'

export type set_difficulty = {
  id: null,
  method: method,
  params: [number]
}

export class SetDifficulty extends Notification {

  static valid(message: JSONValue): boolean {
    let n = Notification.read(message)
    if (!n || n['method'] !== "mining.set_difficulty") {
      return false
    }

    let params = message['params']
    return params.length === 1 && typeof params[0] === 'number' && params[0] > 0
  }

  static difficulty(message): boostpow.Difficulty {
    if (SetDifficulty.valid(message)) return new boostpow.Difficulty(message['params'][0])

    throw "invalid set_difficulty"
  }

  static make(d: boostpow.Difficulty): set_difficulty {
    return {id: null, method: 'mining.set_difficulty', params: [d.number]}
  }

}
