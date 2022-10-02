import { Request } from '../request'
import { Response, BooleanResponse, boolean_response } from '../response'
import { message_id } from '../messageID'
import { SessionID } from '../sessionID'
import { method } from '../method'
import { parameters } from '../message'
import { error } from '../error'
import * as boostpow from 'boostpow'

export type share = [string, string, string, string, string] |
  [string, string, string, string, string, string]

export class Share {

  static valid(params: share): boolean {
    return SessionID.valid(params[4]) && SessionID.valid(params[3]) &&
      /^(([0-9a-f][0-9a-f])*)|(([0-9A-F][0-9A-F])*)$/.test(params[2]) &&
      (params.length === 5 ||
        (params.length === 6 && SessionID.valid(params[5])))
  }

  static read(params: parameters): share | undefined {
    if (params.length < 5 || params.length > 6) return
    for(let elem of params) if (typeof elem !== 'string') return
    if (Share.valid(<share>params)) return <share>params
  }

  static equal(a: share, b:share): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4]
  }

  static workerName(x: share): string {
    if (this.valid(x)) {
      return x[0]
    }

    throw "invalid share"
  }

  static jobID(x: share): string {
    if (this.valid(x)) {
      return x[1]
    }

    throw "invalid share"
  }

  static time(x: share): boostpow.UInt32Little {
    if (this.valid(x)) {
      let t = boostpow.UInt32Little.fromHex(x[3])
      t.buffer.reverse()
      return t
    }

    throw "invalid share"
  }

  static nonce(x: share): boostpow.UInt32Little {
    if (this.valid(x)) {
      let n = boostpow.UInt32Little.fromHex(x[4])
      n.buffer.reverse()
      return n
    }

    throw "invalid share"
  }

  static extranonce2(x: share): boostpow.Bytes {
    if (this.valid(x)) {
      return boostpow.Bytes.fromHex(x[2])
    }

    throw "invalid share"
  }

  static generalPurposeBits(x: share): boostpow.Int32Little | undefined {
    if (this.valid(x)) {
      if (x[5] === undefined) {
        return
      }

      return boostpow.Int32Little.fromHex(x[5])
    }

    throw "invalid share"
  }

  static make(
    worker_name: string,
    job_id: string,
    en2: boostpow.Bytes,
    time: boostpow.UInt32Little,
    nonce: boostpow.UInt32Little,
    gpr?: boostpow.Int32Little): share {

    let t = boostpow.UInt32Little.fromNumber(time.number)
    t.buffer.reverse()

    let n = boostpow.UInt32Little.fromNumber(nonce.number)
    n.buffer.reverse()

    if (gpr) {
      return [worker_name, job_id, en2.hex, t.hex, n.hex, gpr.hex]
    } else {
      return [worker_name, job_id, en2.hex, t.hex, n.hex]
    }
  }
}

export type submit_request = {
  id: message_id,
  method: method,
  params: share
}

export class SubmitRequest extends Request {

  static valid(message: submit_request): boolean {
    if (!(message['method'] === "mining.submit")) {
      return false
    }

    return Share.valid(message['params'])
  }

  static make(
    id: message_id,
    worker_name: string,
    job_id: string,
    en2: boostpow.Bytes,
    time: boostpow.UInt32Little,
    nonce: boostpow.UInt32Little,
    gpr?: boostpow.Int32Little): submit_request {
    return {id: id, method: 'mining.submit', params: Share.make(worker_name, job_id, en2, time, nonce, gpr)}
  }

}

export { BooleanResponse as SubmitResponse }
