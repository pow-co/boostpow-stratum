import { error, Error } from './Stratum/error'
import { JSONValue } from './json'
import { request } from './Stratum/request'
import { response } from './Stratum/response'
import { notification } from './Stratum/notification'
import { subscriptions, subscribe_request, subscribe_response, SubscribeRequest, SubscribeResponse }
  from './Stratum/mining/subscribe'
import { configure_request, configure_response, ConfigureRequest, ConfigureResponse }
  from './Stratum/mining/configure'
import { authorize_request, authorize_response, AuthorizeRequest, AuthorizeResponse }
  from './Stratum/mining/authorize'
import { submit_request, submit_response, SubmitRequest, SubmitResponse }
  from './Stratum/mining/submit'

import { StratumRequest, StratumResponse, StratumHandler, StratumHandlers } from './Stratum/handlers/base'

export function remote_client(): StratumHandlers {

  // undefined indicates that this session does not support Stratum
  // extensions because the configure message was never sent. Otherwise,
  // there is a list of supported extensions.
  let extensions: undefined | {[key: string]: {[key: string]: JSONValue;}}

  function configured(): boolean {
    return extensions === undefined
  }

  function extension_parameters(name: string): {[key: string]: JSONValue;} {
    if (!configured()) return {}

    let p = extensions[name]
    if (!p) return {}

    return p
  }

  function extension_supported(name: string): boolean {
    if (!configured()) return false

    let p = extensions[name]
    if (!p) return false

    return true
  }

  // If the subscribe method has not yet been sent, this is undefined.
  // Otherwise, it has the subscriptions that were sent.
  let subscriptions: undefined | subscriptions

  function subscribed(): boolean {
    return subscriptions === undefined
  }

  // undefined indicates that the authorize request has not been sent.
  let username: undefined | string

  function authorized(): boolean {
    return username === undefined
  }

  return {
    'mining.configure': (request: StratumRequest) => {
      return new Promise<StratumResponse>((resolve, reject) => {
        return resolve({result:null})
      })
    },

    'mining.subscribe': (request: StratumRequest) => {
      return new Promise<StratumResponse>((resolve, reject) => {
        return resolve({result:null})
      })
    },

    'mining.authorize': (request: StratumRequest) => {
      return new Promise<StratumResponse>((resolve, reject) => {
        return resolve({result:null})
      })
    }
  }

}
