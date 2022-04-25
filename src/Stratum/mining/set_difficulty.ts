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

  static valid(message: set_difficulty): boolean {
    return message['method'] === "mining.set_difficulty" && message['params'][0] > 0
  }

  static read(message: JSONValue): set_difficulty | undefined {
    let n = Notification.read(message)
    if (!n) return

    let params = message['params']
    if (params.length === 1 && typeof params[0] === 'number' && SetDifficulty.valid(<set_difficulty>n)) return <set_difficulty>n
  }

  static difficulty(message: set_difficulty): boostpow.Difficulty {
    if (SetDifficulty.valid(message)) return new boostpow.Difficulty(message['params'][0])

    throw "invalid set_difficulty"
  }

  static make(d: boostpow.Difficulty): set_difficulty {
    return {id: null, method: 'mining.set_difficulty', params: [d.number]}
  }

}
