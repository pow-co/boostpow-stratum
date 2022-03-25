import { Notification } from '../notification'
import { method } from '../method'
import { Difficulty } from 'boostpow'

export type show_message = {
  id: null,
  method: method,
  params: [number]
}

export class SetDifficulty extends Notification {

  static valid(message): boolean {
    if (!(Notification.valid(message) && message['method'] === "mining.set_difficulty")) {
      return false
    }

    let params = message['params']
    return params.length === 1 && typeof params[0] === 'number' && params[0] > 0
  }

  static difficulty(message): Difficulty {
    if (SetDifficulty.valid(message)) return new Difficulty(message['params'][0])

    throw "invalid set_difficulty"
  }

  static make(d: Difficulty): show_message {
    return {id: null, method: 'mining.set_difficulty', params: [d.number]}
  }

}
