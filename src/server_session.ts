import * as boostpow from 'boostpow'
import { error, Error } from './Stratum/error'
import { JSONValue } from './json'
import { now_seconds } from './time'
import { SessionID, session_id } from './Stratum/sessionID'
import { message_id } from './Stratum/messageID'
import { request } from './Stratum/request'
import { response } from './Stratum/response'
import { result, parameters } from './Stratum/message'
import { notification } from './Stratum/notification'
import { extranonce, SetExtranonce } from './Stratum/mining/set_extranonce'
import { set_difficulty, SetDifficulty } from './Stratum/mining/set_difficulty'
import { notify, Notify } from './Stratum/mining/notify'
import { Proof } from './Stratum/proof'
import { subscriptions, subscribe_request, subscribe_response, SubscribeRequest, SubscribeResponse }
  from './Stratum/mining/subscribe'
import { configure_request, configure_response, extension_requests,
  extension_result, extension_results,
  ConfigureRequest, ConfigureResponse, Extensions }
  from './Stratum/mining/configure'
import { authorize_request, AuthorizeRequest, AuthorizeResponse }
  from './Stratum/mining/authorize'
import { share, submit_request, Share, SubmitRequest, SubmitResponse }
  from './Stratum/mining/submit'
import { notify_params, NotifyParams } from './Stratum/mining/notify'
import { StratumAssignment, Worker } from './jobs'
import { Local, Remote } from './stratum'
import { StratumRequest, StratumResponse, StratumHandler, StratumHandlers } from './Stratum/handlers/base'
import {extend, ExtensionHandlers} from './extensions'

interface Options {
  // do we require a miner to log in or can he submit shares without it?
  // if he doesn't log in we don't know how to pay him, so if this is allowed
  // the miner has to be us.
  canSubmitWithoutAuthorization?: boolean,

  // max time difference between the reported time of a submitted share and
  // our local time.
  maxTimeDifference?: number,

  // how long do we save old jobs in memory?
  secondsToSaveJobs?: number,

  // how many message ids do we remember to reject duplicates?
  rememberThisManyMessageIds?: number,

  // something to tell the time.
  nowSeconds?: () => boostpow.UInt32Little
}

let default_options = {
  canSubmitWithoutAuthorization: false,
  maxTimeDifference: 5,
  secondsToSaveJobs: 600,
  rememberThisManyMessageIds: 10,
  nowSeconds: now_seconds
}

// Subscribe lets us subscribe to new jobs. The backend could be boost or a mining pool.
type Subscribe = (w: Worker) => undefined | {initial: StratumAssignment, solved: (p: Proof) => void }

interface StratumJob {
  notify: notify_params,
  extranonce: extranonce,
  mask: string|undefined
}

// a number of checks have to pass in order for shares to be accepted.
// this object handles all the information needed to check a share.
let handle_jobs = (maxTimeDifference: number) => {
  // list of previous jobs. We need this because a client
  // may turn in a share for an old job.
  let jobs: StratumJob[] = []

  // list of shares submitted for currently open jobs. We need this
  // to be able to reject duplicate shares.
  let shares: share[] = []

  // find the job that the client is submitting a share for from
  // the job id.
  let find = (jid: string): undefined | {stale: boolean, job: StratumJob} => {
    let stale: boolean = false

    for (let i = jobs.length - 1; i >= 0; i--) {
      let job = jobs[i]
      
      if (NotifyParams.jobID(job.notify) === jid) return {
        stale: stale,
        job: job
      }

      if (NotifyParams.clean(job.notify)) stale = true
    }
  }

  let detect_duplicate = (x: share, now: number): boolean => {
    let i
    for (i = shares.length - 1; i >= 0; i--) {
      let g = shares[i]
      if (now - Share.time(g).number > maxTimeDifference) break
      if (Share.equal(x, g)) return true
    }

    jobs.splice(0, i + 1)

    return false
  }

  return {
    push: (j: StratumJob, now: number) => {
      let i
      for (i = jobs.length - 1; i >= 0; i--) {
        if (now - NotifyParams.time(jobs[i].notify).number >= maxTimeDifference) break
      }

      jobs.splice(0, i + 1)
      jobs.push(j)
    },

    // After a share is found to be valid, it needs to be passed on to the
    // job manager in order to be marked for payment to the client and
    // checked to see if it is a complete boost job / Bitcoin block. function
    // check() takes a function called solved that handles a complete proof
    // and returns a function that tries to construct a complete proof from
    // an incomplete proof. If unsuccessful it returns an error and if
    // successful it runs solved on the complete proof.
    check: (solved: (p: Proof) => void) => {
      return (x: share, d: boostpow.Difficulty, now: number): error => {
        let timestamp = Share.time(x).number


        if (now - timestamp > maxTimeDifference) return Error.make(Error.TIME_TOO_OLD);
        if (timestamp - now > maxTimeDifference) return Error.make(Error.TIME_TOO_NEW);

        let f = find(Share.jobID(x));

        if (f === undefined) return Error.make(Error.JOB_NOT_FOUND);
        if (f.stale) return Error.make(Error.STALE_SHARE);

        let p: Proof = new Proof(f.job.extranonce, f.job.notify, x, f.job.mask);
        // this can only happen if the client forgets to send us a version
        // value when he is supposed to or when he sends one when he's not
        // supposed to.
        if (!p.proof) return Error.make(Error.ILLEGAL_VERMASK);

        // check for duplicate shares.
        if (detect_duplicate(x, now)) return Error.make(Error.DUPLICATE_SHARE)
        if (!p.valid(d)) return Error.make(Error.INVALID_SOLUTION)
        shares.push(x)
        solved(p)
        return null
      }
    },

    hashpower: () => {
      return {hashpower:0, certainty: 0}
    }
  }
}

export function server_session(
  select: Subscribe,
  opts: Options = default_options,
  // undefined indicates that Stratum extensions are not supported.
  // Otherwise there is a list of supported extensions.
  extension_handlers?: ExtensionHandlers
): Local {
  return (remote: Remote, disconnect: () => void) => {
    let running: boolean = true

    function close() {
      running = false
      disconnect()
    }

    let options = default_options
    Object.assign(options, opts)

    let extensions = extend(extension_handlers)

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
    function notify_new_job(j: StratumAssignment) {
      if (extensions.supported("subscribe_extranonce")) send_set_extranonce([id, j.extranonce2Size])

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

    function version_mask(): string|undefined {
      let mask = extensions.parameters('version_rolling').mask
      if (!mask || typeof mask !== 'number') return boostpow.Int32Little.fromNumber(0).hex
      return boostpow.Int32Little.fromNumber(mask).hex
    }

    let jobs = handle_jobs(options.maxTimeDifference)

    // set during the subscribe method. We don't know where to send
    // a solved share until after the worker is registered.
    let checkShare: (x: share, d: boostpow.Difficulty, now: number) => error

    // configure is an optional first message that determines wheher
    // extensions and supported and which ones.
    function configure(params: parameters): StratumResponse {
      // If extensions are not supported, then we are not using the extended
      // protocol, we don't know about this message, and it is an error.
      if (!extension_handlers) return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

      let requested = Extensions.extension_requests(params)
      if (!requested) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}

      // If we have already received the configure method, then only minimum_difficulty is allowed.
      if (extensions.configured() && !(extensions.supported('minimum_difficulty') &&
        requested['minimum_difficulty'] && Object.keys(requested).length === 1))
          return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

      return {result: Extensions.configure_response_result(extensions.handle(requested)), err: null}
    }

    function handleConfigure(request: request): void {
      let response: StratumResponse = configure(request.params)
      response.id = request.id
      remote.respond(<response>response)
      if (response.err != null) close()
    }

    function handleSubscribe(request: request): void {

      if (!extensions.configured()) extensions.handle();

      ((sub, error) => {
        // subscribe can only be called once. -- or can it?
        if (subscribed()) return error(Error.ILLEGAL_METHOD)

        if (!sub) return error(Error.ILLEGAL_PARARMS)

        user_agent = SubscribeRequest.userAgent(sub)

        // if we use subscribe_extranonce, then the result is different.
        let version_rolling: boolean = extensions.supported("version_rolling")
        let subscribe_extranonce: boolean = extensions.supported("subscribe_extranonce")

        let register = select({
          'version_rolling': version_rolling,
          'new_job': notify_new_job,
          'hashpower': jobs.hashpower,
          'minimum_difficulty': extensions.minimum_difficulty,
          'cancel': close
        })
        if (!register) return error(Error.INTERNAL_ERROR)
        let job = register.initial

        checkShare = jobs.check(register.solved)

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

        jobs.push({
          notify: job.notify,
          extranonce: extranonce,
          mask: version_mask()
        }, options.nowSeconds().number)

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

      // can only auhorize once.
      if (authorized()) return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}

      // for now we accept all authorization requests.
      username = auth[0]
      return {result: true, err: null}
    }

    function handleAuthorize(request: request): void {
      if (!extensions.configured()) extensions.handle();
      let response: StratumResponse = authorize(request.params)
      response.id = request.id
      remote.respond(<response>response)
      if (response.err != null) close()
    }

    function submit(request: parameters): StratumResponse {

      if (!subscribed()) return {result: null, err: Error.make(Error.ILLEGAL_METHOD)}
      if (!authorized() && !options.canSubmitWithoutAuthorization) Error.make(Error.UNAUTHORIZED)
      let x = Share.read(request)
      if (!x) return {result: null, err: Error.make(Error.ILLEGAL_PARARMS)}

      let err = checkShare(x, difficulty, options.nowSeconds().number)
      return {result: err === null, err: err}
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

    let requests_ids: message_id[] = []

    let handle = {
      'notify': (n: notification) => {
        // nothing to do here because there is no notification that
        // we need to respond to as the server.
      },
      'request': (r: request) => {

        if(!extensions.configured() && r.method !=='mining.configure')
          extensions.handle();

        let handle = handleRequest[r.method]
        if (!handle) {
          remote.respond({id: r.id, result: null, err: Error.make(Error.ILLEGAL_METHOD)})
          return
        }

        if (requests_ids.includes(r.id)) {
          remote.respond({id: r.id, result: null, err: Error.make(Error.DUPLICATE_MESSAGE_ID)})
          return
        }

        requests_ids.push(r.id)
        if (requests_ids.length > options.rememberThisManyMessageIds) requests_ids.shift()

        handle(r)
      }
    }

    return handle
  }
}
