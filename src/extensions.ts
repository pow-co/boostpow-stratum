import { JSONValue } from './json'
import { SessionID, session_id } from './Stratum/sessionID'
import { configure_request, configure_response, extension_requests,
  extension_result, extension_results,
  ConfigureRequest, ConfigureResponse, Extensions }
  from './Stratum/mining/configure'
import * as boostpow from 'boostpow'

// Parameters we keep in memory for a given extension.
export type ExtensionParameters = {[key: string]: JSONValue;}

// an extension handler takes some requested extension parameters from
// the client and tells us what parameters we need to return to him and
// what we need to remember.
export type HandleExtension = (requested: ExtensionParameters) =>
  {'reply': extension_result, 'keep'?: ExtensionParameters}

export type ExtensionHandlers = {[key: string]: HandleExtension}

export function extend(handlers?: ExtensionHandlers) {

  // undefined indicates that this session does not support Stratum
  // extensions because the configure message was never sent. Otherwise,
  // there is a list of supported extensions.
  let extensions: undefined | {[key: string]: ExtensionParameters}

  // before the first message is sent, we don't know if we are using the
  // extended version of the protocol.
  let extended_protocol: undefined | boolean

  // if no handlers are provided, then we are not using the extended protocol
  if (handlers === undefined) extended_protocol = false

  function parameters(name: string): ExtensionParameters {
    if (!extended_protocol) return {}

    let p = extensions[name]
    if (!p) return {}

    return p
  }

  return {
    configured: (): boolean => {
      return extended_protocol !=undefined
    },
    parameters: parameters,
    // is a given extension supported?
    supported: (name?: string): boolean => {
      if (!extended_protocol) return false
      if (!name) return true

      let p = extensions[name]
      if (!p) return false

      return true
    },
    // minimum difficulty is an extension that let us remember a minimum
    // difficulty to send to the client. If the extension is not supported,
    // this function returns zero.
    minimum_difficulty: (): number => {
      let p = parameters('minimum_difficulty')['value']
      if (p === undefined) return 0
      return <number>p
    },
    handle: (requests?: extension_requests): extension_results => {
      if (!handlers) return {}

      // if we handle extensions with an undefined request, that
      // means that extensions are not suppored for this session.
      if (!requests) {
        extended_protocol = false
        return {}
      }

      extended_protocol = true

      if (!extensions) extensions = {}
      let reply: extension_results = {}

      for (let key of Object.keys(requests)) {
        let h = handlers[key]

        // if we do not have a handler for a given extension,
        // then it is not supported.
        if (!h) {
          reply[key] = [false, {}]
          continue
        }

        let it = h(requests[key])
        reply[key] = it['reply']

        let keep = it['keep']
        if (keep) extensions[key] = keep
      }

      return reply
    }
  }
}

// version rolling is the most important extension because it's needed to
// support ASICBoost.
export function versionRollingHandler(mask: number): HandleExtension {
  return (requested: ExtensionParameters) => {
    if (Object.keys(requested).length != 2) return {reply: ['invalid parameters', {}]}

    let requested_mask = requested['mask']
    let minBitCount = requested['min-bit-count']
    if (!requested_mask || !minBitCount || (typeof requested_mask !== 'string') ||
      !SessionID.valid(requested_mask) || typeof minBitCount !== 'number')
      return {reply: ['invalid parameters', {}]}

    const requested_mask_number = boostpow.UInt32Big.fromHex(requested_mask).number
    let new_mask = mask & requested_mask_number
    let counter = new_mask
    let bit_count = 0

    for (let i = 0; i < 32; i++) {
      if ((counter & 1) == 1) bit_count++
      counter = counter >> 1
    }

    if (bit_count < minBitCount) return {reply: ['could not satisfy min-bit-count', {}]}

    return {
      reply: [true, {mask: new_mask}],
      keep: {mask: new_mask}
    }
  }
}

// subscribe extranonce is also important because it lets us
// change extraNonce2_size
export function subscribeExtranonceHandler(): HandleExtension {
  return (requested: ExtensionParameters) => {
    if (Object.keys(requested).length != 0)
      return {reply: ['invalid parameters', {}]}
    return {reply: [true, {}], keep: {}}
  }
}

// minimum difficulty lets the client set a minimum difficulty with the server.
export function minimumDifficultyHandler(): HandleExtension {
  return (requested: ExtensionParameters) => {
    if (Object.keys(requested).length != 1) return {reply: ['invalid parameters', {}]}
    let value = requested['value']
    if (!value || typeof value !== 'number') return {reply: ['invalid parameters', {}]}
    return {reply: [true, {}], keep: requested}
  }
}

// info is an extension where the client tells the server some information
// about itself that we don't use.
export function infoHandler(): HandleExtension {
  return (requested: ExtensionParameters) => {
    for(const key of Object.keys(requested))
    {
      if(key!=='connection-url' && key!=='hw-version' && key!=='sw-version' && key!=='hw-id' )
        return {reply: ['invalid parameters', {}]};
    }
    return {reply: [true, {}], keep: requested}
  }
}

export let extensionHandlers: ExtensionHandlers = {
  'version_rolling': versionRollingHandler(boostpow.Utils.generalPurposeBitsMask()),
  'minimum_difficulty': minimumDifficultyHandler(),
  'subscribe_extranonce': subscribeExtranonceHandler(),
  'info': infoHandler()
}
