import { randomInteger } from '../random'
import * as boostpow from 'boostpow'

// session id, aka extra nonce 1, is an 8 character hex string that is
// assigned to the client by the server. The session id may change using
// mining.set_extranonce
export type session_id = string

export class SessionID {
  static valid(id: session_id): boolean {
    return typeof id === 'string' && /^([0-9a-f]{8})|([0-9A-F]{8})$/.test(id) &&
     id.length === 8 // seemingly this line should not be necessary but the tests
                    // fail without it.
  }

  static random(): session_id {
    return boostpow.UInt32Big.fromNumber(randomInteger(1, 4294967295)).hex
  }
}
