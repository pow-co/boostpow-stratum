import { error, Error } from './Stratum/error'
import { JSONValue } from './json'
import { SessionID } from './Stratum/sessionID'
import { request } from './Stratum/request'
import { response } from './Stratum/response'
import { notification } from './Stratum/notification'
import { extranonce } from './Stratum/mining/set_extranonce'
import { subscriptions, subscribe_request, subscribe_response, SubscribeRequest, SubscribeResponse }
  from './Stratum/mining/subscribe'
import { configure_request, configure_response, extension_requests,
  ConfigureRequest, ConfigureResponse, Extensions }
  from './Stratum/mining/configure'
import { authorize_request, AuthorizeRequest, AuthorizeResponse }
  from './Stratum/mining/authorize'
import { submit_request, SubmitRequest, SubmitResponse }
  from './Stratum/mining/submit'
import { notify_params, NotifyParams } from './Stratum/mining/notify'
import { StratumJob, Worker } from './jobs'
import { StratumRequest, StratumResponse, StratumHandler, StratumHandlers } from './Stratum/handlers/base'
import * as boostpow from 'boostpow'

// Subscribe lets us subscribe to new jobs. The backend could be boost or a mining pool.
type Subscribe = (w: Worker) => StratumJob | undefined

export function server_session(
  select: Subscribe,
  can_submit_without_authorization: boolean,
  // undefined indicates that Stratum extensions are not supported.
  // Otherwise there is a list of supported extensions.
  extensions_supported?: {[key: string]: {[key: string]: JSONValue;}}
): StratumHandlers {

  // undefined indicates that this session does not support Stratum
  // extensions because the configure message was never sent. Otherwise,
  // there is a list of supported extensions.
  let extensions: undefined | {[key: string]: {[key: string]: JSONValue;}}

  // before the first message is sent, we don't know if we are using the
  // extended version of the protocol.
  let extended_protocol: undefined | boolean

  function extension_parameters(name: string): {[key: string]: JSONValue;} {
    if (!extended_protocol) return {}

    let p = extensions[name]
    if (!p) return {}

    return p
  }

  function extension_supported(name: string): boolean {
    if (!extended_protocol) return false

    let p = extensions[name]
    if (!p) return false

    return true
  }

  function minimum_difficulty(): number {
    let p = extension_parameters('minimum_difficulty')['value']
    if (p === undefined) return 0
    return <number>p
  }

  let jobs: StratumJob[] = []

  let user_agent: undefined | string

  let extranonce: undefined | extranonce

  // If the subscribe method has not yet been sent, this is undefined.
  // Otherwise, it has the subscriptions that were sent.
  let subscriptions: undefined | subscriptions

  function subscribed(): boolean {
    return subscriptions !== undefined
  }

  // undefined indicates that the authorize request has not been sent.
  let username: undefined | string

  function authorized(): boolean {
    return username !== undefined
  }

  function handleConfigure(request: StratumRequest): StratumResponse {
    // If extensions are not supported, then we don't know about this message.
    if (!extensions_supported || extended_protocol === false)
      return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

    let requested: extension_requests = Extensions.extension_requests(request.params)
    if (!requested) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}

    // If we have already received the configure method, then only minimum_difficulty is allowed.
    if (extended_protocol === true) {
      let min_diff = requested['minimum_difficulty']
      if (!min_diff || Object.keys(extended_protocol).length != 1)
        return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}
    }

    extended_protocol = true

    // TODO finish this.
    return {result: null, err: Error.make(Error.INTERNAL_ERROR)}
  }

  function handleSubscribe(request: StratumRequest): StratumResponse {
    let sub = SubscribeRequest.read(request)
    if (!sub) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}

    if (extended_protocol === undefined) extended_protocol = false

    // subscribe can only be called once.
    if (subscribed()) return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

    user_agent = SubscribeRequest.userAgent(sub)

    let subscribe_extranonce: boolean = extension_supported("subscribe_extranonce")

    let job = select({
      'subscribe_extranonce': subscribe_extranonce,
      'new_job': (Job) => {},
      'hashpower':() => { return {'hashpower': 0, 'certainty': 0} },
      'minimum_difficulty': minimum_difficulty,
      'cancel': () => {}
    })
    if (!job) return {result:null, err: Error.make(Error.INTERNAL_ERROR)}

    jobs.push(job)

    if (subscribe_extranonce) {
      subscriptions = [['mining.notify', SubscribeResponse.random_subscription_id()],
        ['mining.set_difficulty', SubscribeResponse.random_subscription_id()],
        ['mining.set_extranonce', SubscribeResponse.random_subscription_id()]]
    } else {
      subscriptions = [['mining.notify', SubscribeResponse.random_subscription_id()],
        ['mining.set_difficulty', SubscribeResponse.random_subscription_id()]]
    }

    // has the user requestd an extranonce1?
    let n1 = SubscribeRequest.extranonce1(sub)
    let extranonce = [n1 ? n1.hex : SessionID.random(), job.extranonce2Size]

    return {result:[subscriptions, extranonce[0], extranonce[1]], err: null}
  }

  function handleAuthorize(request: StratumRequest): StratumResponse {
    let auth = AuthorizeRequest.read(request)
    if (!auth) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}

    if (extended_protocol === undefined) extended_protocol = false

    // can only auhorize once.
    if (authorized()) return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

    // for now we accept all authorization requests.
    username = AuthorizeRequest.username(auth)
    return {result: true, err: null}
  }

  return {
    'mining.configure': (request: StratumRequest) => {
      return new Promise<StratumResponse>((resolve, reject) => {
        return resolve(handleConfigure(request))
      })
    },

    'mining.subscribe': (request: StratumRequest) => {
      return new Promise<StratumResponse>((resolve, reject) => {
        return resolve(handleSubscribe(request))
      })
    },

    'mining.authorize': (request: StratumRequest) => {
      return new Promise<StratumResponse>((resolve, reject) => {
        return resolve(handleAuthorize(request))
      })
    }
  }
}
