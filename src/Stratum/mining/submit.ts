import { Request } from '../request'
import { Response, BooleanResponse } from '../response'
import { message_id } from '../messageID'
import { SessionID } from '../sessionID'
import { method } from '../method'
import { error } from '../error'
import { UInt32Little, Int32Little, Bytes } from 'boostpow'

export type share = [string, string, string, string, string] |
  [string, string, string, string, string, string]

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

    let params = message['params']
    return SessionID.valid(params[2]) && SessionID.valid(params[3]) &&
      /^(([0-9a-f][0-9a-f])*)|(([0-9A-F][0-9A-F])*)$/.test(params[4]) &&
      (params.length === 5 ||
        (params.length === 6 && SessionID.valid(params[5])))
  }

  static workerName(message: submit_request): string {
    if (this.valid(message)) {
      return message['params'][0]
    }

    throw "invalid submit request"
  }

  static jobID(message: submit_request): string {
    if (this.valid(message)) {
      return message['params'][1]
    }

    throw "invalid submit request"
  }

  static timestamp(message: submit_request): UInt32Little {
    if (this.valid(message)) {
      return UInt32Little.fromHex(message['params'][2])
    }

    throw "invalid submit request"
  }

  static nonce(message: submit_request): UInt32Little {
    if (this.valid(message)) {
      return UInt32Little.fromHex(message['params'][3])
    }

    throw "invalid submit request"
  }

  static extranonce2(message: submit_request): Bytes {
    if (this.valid(message)) {
      return new Bytes(Buffer.from(message['params'][4], 'hex'))
    }

    throw "invalid submit request"
  }

  static generalPurposeBits(message: submit_request): Int32Little | undefined {
    if (this.valid(message)) {
      if (message['params'][5] === undefined) {
        return
      }

      return Int32Little.fromHex(message['params'][5])
    }

    throw "invalid submit request"
  }

  static make(id: message_id, worker_name: string, job_id: string, time: UInt32Little, nonce: UInt32Little, en2: Bytes, gpr?: Int32Little): submit_request {
    if (gpr) {
      return {id: id, method: 'mining.submit', params: [worker_name, job_id, time.hex, nonce.hex, en2.hex, gpr.hex]}
    } else {
      return {id: id, method: 'mining.submit', params: [worker_name, job_id, time.hex, nonce.hex, en2.hex]}
    }
  }
}

export type SubmitResponse = BooleanResponse
