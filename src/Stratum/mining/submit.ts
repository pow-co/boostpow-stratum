import { Request } from '../request'
import { Response, BooleanResponse, boolean_response } from '../response'
import { message_id } from '../messageID'
import { SessionID } from '../sessionID'
import { method } from '../method'
import { error } from '../error'
import { UInt32Big, UInt32Little, Int32Little, Bytes } from 'boostpow'

export type share = [string, string, string, string, string] |
  [string, string, string, string, string, string]

export class Share {

  static valid(params: share): boolean {
    return SessionID.valid(params[2]) && SessionID.valid(params[3]) &&
      /^(([0-9a-f][0-9a-f])*)|(([0-9A-F][0-9A-F])*)$/.test(params[4]) &&
      (params.length === 5 ||
        (params.length === 6 && SessionID.valid(params[5])))
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

  static timestamp(x: share): UInt32Little {
    if (this.valid(x)) {
      return UInt32Little.fromHex(x[2])
    }

    throw "invalid share"
  }

  static nonce(x: share): UInt32Little {
    if (this.valid(x)) {
      return UInt32Little.fromHex(x[3])
    }

    throw "invalid share"
  }

  static extranonce2(x: share): Bytes {
    if (this.valid(x)) {
      return Bytes.fromHex(x[4])
    }

    throw "invalid share"
  }

  static generalPurposeBits(x: share): Int32Little | undefined {
    if (this.valid(x)) {
      if (x[5] === undefined) {
        return
      }

      return Int32Little.fromHex(x[5])
    }

    throw "invalid share"
  }

  static make(worker_name: string, job_id: string, time: UInt32Little, nonce: UInt32Little, en2: Bytes, gpr?: Int32Little): share {
    if (gpr) {
      return [worker_name, job_id, time.hex, nonce.hex, en2.hex, gpr.hex]
    } else {
      return [worker_name, job_id, time.hex, nonce.hex, en2.hex]
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
    if (!(Request.valid(message) && message['method'] === "mining.submit")) {
      return false
    }

    return Share.valid(message['params'])
  }

  static make(id: message_id, worker_name: string, job_id: string, time: UInt32Little, nonce: UInt32Little, en2: Bytes, gpr?: Int32Little): submit_request {
    return {id: id, method: 'mining.submit', params: Share.make(worker_name, job_id, time, nonce, en2, gpr)}
  }

}

export type submit_response = boolean_response
export let SubmitResponse = BooleanResponse
