import { Notification } from '../notification'
import { SessionID } from '../sessionID'
import { message_id } from '../messageID'
import { method } from '../method'
import { UInt32Big, Digest32, UInt32Little, Difficulty, Int32Little, Bytes } from 'boostpow'

export type notify_params = [string, string, string, string, string[], string, string, string, boolean]

export type notify = {
  id: null,
  method: method,
  params: notify_params
}

export class Notify extends Notification {

  static valid(message: notify): boolean {
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

    for (let digest of params[4]) {
      if (!(is_hex(digest) && digest.length === 64)) {
        return false
      }
    }

    return true
  }

  static jobID(message: notify): string {
    if (this.valid(message)) {
      return message['params'][0]
    }

    throw "invalid notify"
  }

  static prevHash(message: notify): Digest32 {
    if (this.valid(message)) {
      return Digest32.fromHex(message['params'][1])
    }

    throw "invalid notify"
  }

  static generationTX1(message: notify): Buffer {
    if (this.valid(message)) {
      return Buffer.from(message['params'][2], 'hex')
    }

    throw "invalid notify"
  }

  static generationTX2(message: notify): Buffer {
    if (this.valid(message)) {
      return Buffer.from(message['params'][3], 'hex')
    }

    throw "invalid notify"
  }

  static merkleBranch(message: notify): Digest32[] {
    if (!this.valid(message)) throw "invalid notify"

    let path_hex: string[] = message['params'][4]

    let path: Digest32[] = []
    for (let d of path_hex) {
      path.push(Digest32.fromHex(d))
    }

    return path
  }

  static version(message: notify): Int32Little {
    if (this.valid(message)) {
      return Int32Little.fromHex(message['params'][5])
    }

    throw "invalid notify"
  }

  static nbits(message: notify): Difficulty {
    if (this.valid(message)) {
      return new Difficulty(UInt32Little.fromHex(message['params'][6]).number)
    }

    throw "invalid notify"
  }

  static time(message: notify): UInt32Little {
    if (this.valid(message)) {
      return UInt32Little.fromHex(message['params'][7])
    }

    throw "invalid notify"
  }

  static clean(message: notify): boolean {
    if (this.valid(message)) {
      return message['params'][8]
    }

    throw "invalid notify"
  }

  static make(job_id: string, prev_hash: Digest32, gtx1: Bytes, gtx2: Bytes,
    branch: Digest32[], version: Int32Little, bits: Difficulty,
    time: UInt32Little, clean: boolean): notify {

    let path: string[] = []
    for (let d of branch) {
      path.push(d.hex)
    }

    return {id: null, method: 'mining.notify',
      params: [job_id, prev_hash.hex, gtx1.hex, gtx2.hex, path, version.hex, bits.hex, time.hex, clean]}
  }

}
