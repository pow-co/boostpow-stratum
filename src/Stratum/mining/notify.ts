import { Notification } from '../notification'
import { message_id } from '../messageID'
import { method } from '../method'
import { Digest32, Int32Little, UInt32Little } from 'boostpow'

export type notify_params = [string, string, string, string, string[], string, string, string, boolean]

export type notify = {
  id: null,
  method: method,
  params: notify_params
}

export class Notify extends Notification {

  static valid(message: notify): bool {
    if (!(Notification.valid(message) && message['method'] === "mining.notify")) {
      return false
    }

    let params = message['params']

    let is_hex = function(hex) {
      return typeof hex === 'string' && /^(([0-9a-f][0-9a-f])*)|(([0-9A-F][0-9A-F])*)$/.test(hex)
    }

    if (!(params.length === 9 && SessionID.valid(params[0]) &&
      is_hex(params[1]) && params[1].length == 64 &&
      is_hex(params[2]) && is_hex(params[3]) && Array.isArray(params[4]) &&
      SessionID.valid(params[5]) && SessionID.valid(params[6]) &&
      SessionID.valid(params[7]) && typeof params[8] === 'boolean')) {
      return false
    }

    for (digest of params[4]) {
      if (!(is_hex(digest) && digest.length === 64)) {
        return false
      }
    }

    return true
  }

  static jobID(message: notify): string {
    if (SetExtranonce.valid(message)) {
      return message['params'][0]
    }

    throw "invalid notify"
  }

  static prevHash(message: notify): Digest32 {
    if (SetExtranonce.valid(message)) {
      return boostpow.Digest32.fromHex(message['params'][1])
    }

    throw "invalid notify"
  }

  static generationTX1(message: notify): Buffer {
    if (SetExtranonce.valid(message)) {
      return Buffer.from(message['params'][2], 'hex')
    }

    throw "invalid notify"
  }

  static generationTX2(message: notify): Buffer {
    if (SetExtranonce.valid(message)) {
      return Buffer.from(message['params'][3], 'hex')
    }

    throw "invalid notify"
  }

  static merkleBranch(message: notify): Digest32[] {
    if (SetExtranonce.valid(message)) {
      return message['params'][4]
    }

    throw "invalid notify"
  }

  static version(message: notify): Int32Little {
    if (SetExtranonce.valid(message)) {
      return boostpow.Int32Little.fromHex(message['params'][5])
    }

    throw "invalid notify"
  }

  static nonce(message: notify): UInt32Little {
    if (SetExtranonce.valid(message)) {
      return boostpow.UInt32Little.fromHex(message['params'][6])
    }

    throw "invalid notify"
  }

  static time(message: notify): UInt32Little {
    if (SetExtranonce.valid(message)) {
      return boostpow.UInt32Little.fromHex(message['params'][7])
    }

    throw "invalid notify"
  }

  static clean(message: notify): boolean {
    if (SetExtranonce.valid(message)) {
      return message['params'][8]
    }

    throw "invalid notify"
  }

}
