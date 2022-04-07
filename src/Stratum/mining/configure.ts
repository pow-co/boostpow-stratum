import { Request } from '../request'
import { Response } from '../response'
import { message_id } from '../messageID'
import { SessionID } from '../sessionID'
import { method } from '../method'
import { JSONValue } from '../message'
import { error } from '../error'
import { Difficulty, Int32Little } from 'boostpow'

// https://github.com/slushpool/stratumprotocol/blob/master/stratum-extensions.mediawiki

export type configure_params = [string[], {[key: string]: JSONValue;}]

export type configure_result = {[key: string]: JSONValue;}

// an object containing keys for the names of the extensions and
// values of objects containing the parameters for the requests.
export type extension_requests = {[key: string]: {[key: string] : JSONValue;};}

export type extension_result = [boolean | string, object];

// an object containing keys for the names of the extensions and
// values of extension_result. The first value is whether the request
// was successful and the second contains parameters.
export type extension_results = {[key: string]: [extension_result, {[key: string]: JSONValue;}];}

export type configure_request = {
  id: message_id,
  method: method,
  params: configure_params
}

export type configure_response = {
  id: message_id,
  result: configure_result
  err: error
}

export class Extensions {

  // transform the Stratum configure request params into something that is easy
  // to iterate over.
  static extension_requests(p: configure_params): extension_requests | undefined {
    var requests = {}

    for (let name of p[0]) {
      requests[name] = {}
    }

    for (let key in p[1]) {
      let z = key.split(".")

      if (z.length != 2 || requests[z[0]] === undefined) {
        return
      }

      requests[z[0]][z[1]] = p[1][key]
    }

    return requests;
  }

  // Transform back to the Stratum format.
  static configure_request_params(q: extension_requests): configure_params {
    var names = []
    var params = {}

    for (let name in q) {
      let p = q[name]
      names.push(name)

      for (let value in p) {
        params[name + "." + value] = p[value]
      }
    }

    return [names, params]
  }

  // transform the Sttratum configure response result into something that is
  // easy to iterate over.
  static extension_results(r: configure_result): extension_results | undefined {
    var names = {}
    var params = {}

    for (let key in r) {
      let z = key.split(".")
      let value = r[key]
      if (z.length == 1) {
        if (typeof value !== "boolean" && typeof value !== "string") {
          return
        }

        if (names[z[0]] !== undefined) {
          return
        }

        names[z[0]] = value
        if (params[z[0]] === undefined) {
          params[z[0]] = {}
        }

      } else if (z.length == 2) {
        if (params[z[0]] === undefined) {
          params[z[0]] = {}
        }

        params[z[0]][z[1]] = value
      } else {
        return
      }
    }


    var results = {}
    for (let name in params) {
      if (names[name] === undefined) {
        return
      }

      results[name] = [names[name], params[name]]
    }

    return results
  }

  // Transform back to the Stratum format.
  static configure_response_result(r: extension_results): configure_result {
    var result = {}

    for (let key in r) {
      let value = r[key]
      result[key] = value[0]

      for (let k in value[1]) {
        result[key + "." + k] = value[1][k]
      }
    }

    return result
  }

}

export class ExtensionVersionRolling {
  static valid_params = function(r: {'mask':string, 'min-bit-count':number}): boolean {
    return SessionID.valid(r['mask']) && Number.isInteger(r['min-bit-count']) && r['min-bit-count'] >= 0
  }

  static valid_result = function(r: {'mask':string}): boolean {
    return SessionID.valid(r['mask'])
  }

  static requestParams(mask: Int32Little, minBitCount: number): object {
    return {mask: mask.hex, 'min-bit-count': minBitCount}
  }

  static result(success: boolean | string, mask?: Int32Little): object {
    if (success === true) {
      if (mask) {
        return [success, mask.hex]
      }

      throw "invalid version rolling result"
    }

    return [success, {}]
  }
}

export class ExtensionMinimumDifficulty {
  static valid_params = function(r: {'value': number}): boolean {
    return r['value'] > 0
  }

  static valid_result = function(r: {}): boolean {
    return true
  }

  static requestParams(d: Difficulty): object {
    return {}
  }

  static result(success: boolean | string): object {
    return [success, {}]
  }
}

export class ExtensionSubscribeExtranonce {
  static valid_params = function(r: {}): boolean {
    return true
  }

  static valid_result = function(r: {}): boolean {
    return true
  }

  static requestParams(): object {
    return {}
  }

  static result(success: boolean | string): object {
    return [success, {}]
  }
}

export class ExtensionInfo {
  static valid_params = function(r: {
    'connection-url': string,
    'hw-version': string,
    'sw-version': string,
    'hw-id': string}) : boolean {
    return true
  }

  static valid_result = function(r: {}) : boolean {
    return true
  }

  static requestParams(connectionUrl: string, HWVersion: string, SWVersion: string, HWID: string): object {
    return {
      'connection-url': connectionUrl,
      'hw-version': HWVersion,
      'sw-version': SWVersion,
      'hw-id': HWID
    }
  }

  static result(success: boolean | string): extension_result {
    return [success, {}]
  }
}

export class ConfigureRequest {
  static valid(r: configure_request): boolean {
    if (r.method !== 'mining.configure') {
      return false
    }

    let exq = Extensions.extension_requests(r['params'])

    if (!exq) {
      return false
    }

    let known_extensions = {
      'version-rolling': ExtensionVersionRolling.valid_params,
      'minimum-difficulty': ExtensionMinimumDifficulty.valid_params,
      'subscribe-extranonce': ExtensionSubscribeExtranonce.valid_params,
      'info': ExtensionInfo.valid_params
    }

    for (let name in exq) {
      let val = known_extensions[name]
      if (val && !val(exq[name])) {
        return false
      }
    }

    return true
  }

  static make(id: message_id, q: extension_requests): configure_request {
    return {id: id, method: 'mining.configure', params: Extensions.configure_request_params(q)}
  }

}

export class ConfigureResponse {
  static valid(r: configure_response): boolean {
    let exr = Extensions.extension_results(r['result'])

    if (!exr) {
      return r.err != null
    }

    let known_extensions = {
      'version-rolling': ExtensionVersionRolling.valid_result,
      'minimum-difficulty': ExtensionMinimumDifficulty.valid_result,
      'subscribe-extranonce': ExtensionSubscribeExtranonce.valid_result,
      'info': ExtensionInfo.valid_result
    }

    for (let name in exr) {
      let val = known_extensions[name]
      if (val && !val(exr[name][1])) {
        return false
      }
    }

    return true
  }

  static make(id: message_id, s: extension_results, err?: error): configure_response {
    return {id: id, err: err ? err : null, result: Extensions.configure_response_result(s)}
  }

}
