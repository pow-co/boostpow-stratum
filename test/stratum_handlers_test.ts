
import { expect } from './utils'
import { remote_client } from '../src/remote_client'
import { message_id } from '../src/Stratum/messageID'
import { response, Response } from '../src/Stratum/response'
import { Error } from '../src/Stratum/error'
import { StratumResponse } from '../src/Stratum/handlers/base'
import { SubscribeResponse } from '../src/Stratum/mining/subscribe'
import { ConfigureResponse, Extensions } from '../src/Stratum/mining/configure'
import { AuthorizeResponse } from '../src/Stratum/mining/authorize'
import { handleStratumRequest } from '../src/stratum'

describe("Stratum Handlers Client -> Server -> Client", () => {

  it("mining.subscribe should return the correct response for the unexteded protocol", async () => {
    let handle = handleStratumRequest(remote_client(true))

    let response = await handle({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    expect(SubscribeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it("mining.configure should return the correct response for extensions not supported", async () => {
    let handle = handleStratumRequest(remote_client(true))

    let response = await handle({
      id: 2,
      method: 'mining.configure',
      // we are not asking to support any extensions, but this version of the protocol
      // doesn't know about the configure message at all.
      params: [[], {}]
    })

    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(true)
  })

  it("mining.authorize should return the correct response", async () => {
    let handle = handleStratumRequest(remote_client(true))

    let response = await handle({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    expect(AuthorizeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it("mining.authorize cannot be called twice", async () => {
    let handle = handleStratumRequest(remote_client(true))

    handle({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    let response = await handle({
      id: 3,
      method: 'mining.authorize',
      params: ['daniel']
    })

    expect(Error.is_error(response.err)).to.equal(true)
  })

  it("mining.subscribe cannot be called twice", async () => {
    let handle = handleStratumRequest(remote_client(true))

    handle({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    let response = await handle({
      id: 3,
      method: 'mining.authorize',
      params: ['daniel']
    })

    expect(Error.is_error(response.err)).to.equal(true)
  })

  it.skip("cannot reuse message ids", async () => {
    let handle = handleStratumRequest(remote_client(true))

    handle({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    let response = await handle({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    expect(Error.is_error(response.err)).to.equal(true)
  })

  it.skip("mining.configure should return the correct response for extensions supported", async () => {
    let handle = handleStratumRequest(remote_client(true, {
      'info': {},
      'subscribe_extranonce': {},
      'minimum_difficulty': {},
      'version_rolling': {'mask': 'ffffffff'}}))

    let response = await handle({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        'subscribe_extranonce': {},
        'minimum_difficulty': {'value': 1},
        'version_rolling': {'mask': 'ffffffff', 'min-bit-count': 2}})
    })

    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(false)

    // TODO check that we have the correct results here.
  })

  it.skip("mining.configure cannot be the second message", async () => {
  })

  it.skip("mining.configure CAN be the second message if it's only minimum_difficulty", async () => {
  })

  it.skip("mining.configure sends an error if it can't support the right min bit count for version_rolling", async () => {
  })

  it.skip("mining.subscribe should return the correct response for the extended protocol", async () => {
    let handle = handleStratumRequest(remote_client(true, {'subscribe_extranonce': {}}))

    let response = await handle({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({'subscribe_extranonce': {}})
    })

    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(false)

  })

})
