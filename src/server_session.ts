import { error, Error } from './Stratum/error'
import { JSONValue } from './json'
import { SessionID, session_id } from './Stratum/sessionID'
import { request } from './Stratum/request'
import { response } from './Stratum/response'
import { result, parameters } from './Stratum/message'
import { notification } from './Stratum/notification'
import { extranonce, SetExtranonce } from './Stratum/mining/set_extranonce'
import { set_difficulty, SetDifficulty } from './Stratum/mining/set_difficulty'
import { notify, Notify } from './Stratum/mining/notify'
import { subscriptions, subscribe_request, subscribe_response, SubscribeRequest, SubscribeResponse }
  from './Stratum/mining/subscribe'
import { configure_request, configure_response, extension_requests,
  extension_result, extension_results,
  ConfigureRequest, ConfigureResponse, Extensions }
  from './Stratum/mining/configure'
import { authorize_request, AuthorizeRequest, AuthorizeResponse }
  from './Stratum/mining/authorize'
import { Share, submit_request, SubmitRequest, SubmitResponse }
  from './Stratum/mining/submit'
import { notify_params, NotifyParams } from './Stratum/mining/notify'
import { StratumJob, Worker } from './jobs'
import { Local, Remote } from './stratum'
import { StratumRequest, StratumResponse, StratumHandler, StratumHandlers } from './Stratum/handlers/base'
import * as boostpow from 'boostpow'

// Subscribe lets us subscribe to new jobs. The backend could be boost or a mining pool.
type Subscribe = (w: Worker) => StratumJob | undefined

// Parameters we keep in memory for a given extension.
type ExtensionParameters = {[key: string]: JSONValue;}

// an extension handler takes some requested extension parameters from
// the client and tells us what parameters we need to return to him and
// what we need to remember.
type HandleExtension = (requested: ExtensionParameters) =>
  {'reply': extension_result, 'keep'?: ExtensionParameters}

export function server_session(
  select: Subscribe,
  can_submit_without_authorization: boolean,
  // undefined indicates that Stratum extensions are not supported.
  // Otherwise there is a list of supported extensions.
  extension_handlers?: {[key: string]: HandleExtension}
): Local {
  return (remote: Remote, disconnect: () => void) => {
    let running: boolean = true

    function close() {
      running = false
      disconnect()
    }

    // undefined indicates that this session does not support Stratum
    // extensions because the configure message was never sent. Otherwise,
    // there is a list of supported extensions.
    let extensions: undefined | {[key: string]: ExtensionParameters}

    // before the first message is sent, we don't know if we are using the
    // extended version of the protocol.
    let extended_protocol: undefined | boolean

    // which parameters do we store for a given extension?
    function extension_parameters(name: string): ExtensionParameters {
      if (!extended_protocol) return {}

      let p = extensions[name]
      if (!p) return {}

      return p
    }

    // is a given extension supported?
    function extension_supported(name: string): boolean {
      if (!extended_protocol) return false

      let p = extensions[name]
      if (!p) return false

      return true
    }

    // minimum difficulty is an extension that let us remember a minimum
    // difficulty to send to the client. If the extension is not supported,
    // this function returns zero.
    function minimum_difficulty(): number {
      let p = extension_parameters('minimum_difficulty')['value']
      if (p === undefined) return 0
      return <number>p
    }

    // list of recent jobs.
    let jobs: StratumJob[] = []

    // set during the subscribe method.
    let id: session_id | undefined

    let difficulty: boostpow.Difficulty
    let next_difficulty: boostpow.Difficulty

    let extranonce: extranonce
    let next_extranonce: extranonce

    // send a set difficulty message to the client and remember
    // for when he submits a share later. The setting is not
    // applied until after the next notify message is sent.
    function send_set_difficulty(d: boostpow.Difficulty) {
      next_difficulty = d
      remote.notify(SetDifficulty.make(d))
    }

    // send a set extranonce message to the client and remember
    // for when he submits a share later. The setting is not
    // applied until after the next notify message is sent.
    function send_set_extranonce(en: extranonce) {
      next_extranonce = en
      remote.notify({id:null, method:'mining.set_extranonce', params: en})
    }

    // send a notify message to the client.
    function send_mining_notify(p: notify_params) {
      // apply latest difficulty and extra nonces.
      if (next_difficulty) difficulty = next_difficulty
      if (next_extranonce) extranonce = next_extranonce
      remote.notify({id: null, method:'mining.notify', params: p})
    }

    // when we know of a new job, we have to send a notify message.
    function notify_new_job(j: StratumJob) {
      if (extension_supported("subscribe_extranonce")) send_set_extranonce([id, j.extranonce2Size])

      // we always use the same difficulty as the job for now.
      send_set_difficulty(NotifyParams.nbits(j.notify))
      send_mining_notify(j.notify)
    }

    // the user agent string sent in the subscribe method.
    let user_agent: undefined | string

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

    // configure is an optional first message that determines wheher
    // extensions and supported and which ones.
    function handleConfigure(request: request): void {
      remote.respond(((requested: extension_requests, result, error) => {
        // If extensions are not supported, then we don't know about this message.
        if (!extension_handlers || extended_protocol === false)
          return error(Error.ILLEGAL_METHOD)

        if (!requested) return error(Error.ILLEGAL_PARARMS)

        // If we have already received the configure method, then only minimum_difficulty is allowed.
        if (extended_protocol === true && extension_supported('minimum_difficulty')) {
          let min_diff = requested['minimum_difficulty']
          if (!min_diff || Object.keys(requested).length != 1)
            return error(Error.ILLEGAL_PARARMS)

          let it = extension_handlers['minimum_difficulty'](requested['minimum_difficulty'])

          let keep = it['keep']
          if (keep) extensions['minimum_difficulty'] = keep

          return result({'minimum_difficulty': it['reply']})
        } return error(Error.ILLEGAL_METHOD)

        extended_protocol = true
        extensions = {}
        let reply: extension_results = {}

        for (let key of Object.keys(requested)) {
          let h = extension_handlers[key]

          if (!h) {
            reply[key] = [false, {}]
            continue
          }

          let it = h(requested[key])
          reply[key] = it['reply']

          let keep = it['keep']
          if (keep) extensions[key] = keep
        }

        return result(reply)
      })(Extensions.extension_requests(request.params),
        (r: extension_results) => {
          return {id: request.id, result: Extensions.configure_response_result(r), err: null}
        },
        (err: number) => {
          return {id: request.id, result: null, err: Error.make(err)}
        }
      ))
    }

    function handleSubscribe(request: request): void {
      ((sub, error) => {
        if (!sub) return error(Error.ILLEGAL_PARARMS)

        if (extended_protocol === undefined) extended_protocol = false

        // subscribe can only be called once. -- or can it?
        if (subscribed()) return error(Error.ILLEGAL_METHOD)

        user_agent = SubscribeRequest.userAgent(sub)

        // if we use subscribe_extranonce, then the result is different.
        let subscribe_extranonce: boolean = extension_supported("subscribe_extranonce")

        let job = select({
          'subscribe_extranonce': subscribe_extranonce,
          'new_job': notify_new_job,
          'hashpower':() => { return {'hashpower': 0, 'certainty': 0} },
          'minimum_difficulty': minimum_difficulty,
          'cancel': close
        })
        if (!job) return error(Error.INTERNAL_ERROR)

        jobs.push(job)

        subscriptions = subscribe_extranonce ?
          [['mining.notify', SubscribeResponse.random_subscription_id()],
            ['mining.set_difficulty', SubscribeResponse.random_subscription_id()],
            ['mining.set_extranonce', SubscribeResponse.random_subscription_id()]] :
          [['mining.notify', SubscribeResponse.random_subscription_id()],
            ['mining.set_difficulty', SubscribeResponse.random_subscription_id()]]

        // has the user requestd an extranonce1?
        let n1 = SubscribeRequest.extranonce1(sub)
        let id = n1 ? n1.hex : SessionID.random()

        extranonce = [id, job.extranonce2Size]

        remote.respond({id: request.id, result: [subscriptions, id, job.extranonce2Size], err: null})
        send_set_difficulty(NotifyParams.nbits(job.notify))
        send_mining_notify(job.notify)
      })(SubscribeRequest.read(request),
      (err: number) => {
        remote.respond({id: request.id, result: null, err: Error.make(err)})
        close()
      })
    }

    function authorize(params: parameters): StratumResponse {
      let auth = AuthorizeRequest.read_params(params)

      if (!auth) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}

      if (extended_protocol === undefined) extended_protocol = false

      // can only auhorize once.
      if (authorized()) return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

      // for now we accept all authorization requests.
      username = auth[0]
      return {result: true, err: null}
    }

    function handleAuthorize(request: request): void {
      let response: StratumResponse = authorize(request.params)
      response.id = request.id
      remote.respond(<response>response)
      if (response.err != null) close()
    }

    function submit(request: parameters): StratumResponse {
      let x = Share.read(request)
      if (!x) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}
      // TODO
      return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}
    }

    function handleSubmit(request: request): void {
      let response: StratumResponse = submit(request.params)
      response.id = request.id
      remote.respond(<response>response)
    }

    let handleRequest = {
      'mining.configure': handleConfigure,
      'mining.subscribe': handleSubscribe,
      'mining.authorize': handleAuthorize,
      'mining.submit': handleSubmit
    }

    let handle = {
      'notify': (n: notification) => {
        // nothing to do here because there is no notification that
        // we need to respond to as the server.
      },
      'request': (r: request) => {
        let handle = handleRequest[r.method]
        if (!handle) {
          remote.respond({id: r.id, result: null, err: Error.make(Error.ILLEGAL_METHOD)})
          return
        }
        handle(r)
      }
    }

    return handle
  }
}