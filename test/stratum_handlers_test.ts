import { expect } from './utils'
import { server_session } from '../src/server_session'
import { message_id } from '../src/Stratum/messageID'
import { response, Response } from '../src/Stratum/response'
import { Error } from '../src/Stratum/error'
import { StratumResponse } from '../src/Stratum/handlers/base'
import { SubscribeResponse } from '../src/Stratum/mining/subscribe'
import { ConfigureResponse, Extensions } from '../src/Stratum/mining/configure'
import { AuthorizeResponse } from '../src/Stratum/mining/authorize'
import { handleStratumRequest } from '../src/stratum'
import { notify_params } from '../src/Stratum/mining/notify'
import { BoostOutput, job_manager } from '../src/jobs'
import * as bsv from 'bsv'
import * as boostpow from 'boostpow'

describe("Stratum Handlers Client -> Server -> Client", () => {

  // dummy boost data taken from boostpow-js

  // category corresponds to version in the Bitcoin protocol.
  const categoryHex = "d2040000"

  // content corresponds to previous.
  const contentString = "hello animal"
  const contentBuffer = boostpow.Utils.stringToBuffer(contentString, 32)
  const contentHex = new Buffer(contentBuffer).reverse().toString("hex")

  const difficulty = 0.0001

  // tag, data, and user nonce are parts of metadata, which corresponds to
  // coinbase.
  const tagString = "this is a tag"
  const tagBuffer = new Buffer(tagString, "ascii")
  const tagHex = tagBuffer.toString("hex")

  const dataString = "this is more additionalData"
  const dataBuffer = new Buffer(dataString, "ascii")
  const dataHex = dataBuffer.toString("hex")

  const userNonceHex = "c8010000"

  const minerPubKeyHashHex = "1A7340DA6FB3F728439A4BECFCA9CBEDDAF8795F"
  const minerPubKeyHashBuffer = new Buffer(minerPubKeyHashHex, "hex")

  const jobBountyV1 = boostpow.Job.fromObject({
    category: categoryHex,
    content: contentHex,
    diff: difficulty,
    tag: tagHex,
    additionalData: dataHex,
    userNonce: userNonceHex,
  })

  const jobBountyV2 = boostpow.Job.fromObject({
    category: categoryHex,
    content: contentHex,
    diff: difficulty,
    tag: tagHex,
    additionalData: dataHex,
    userNonce: userNonceHex,
    useGeneralPurposeBits: true
  })

  const jobContractV1 = boostpow.Job.fromObject({
    category: categoryHex,
    content: contentHex,
    diff: difficulty,
    tag: tagHex,
    additionalData: dataHex,
    userNonce: userNonceHex,
    minerPubKeyHash: minerPubKeyHashHex,
  })

  const jobContractV2 = boostpow.Job.fromObject({
    category: categoryHex,
    content: contentHex,
    diff: difficulty,
    tag: tagHex,
    additionalData: dataHex,
    userNonce: userNonceHex,
    minerPubKeyHash: minerPubKeyHashHex,
    useGeneralPurposeBits: true
  })

  let txid = boostpow.Digest32.fromHex('abcdef0a0b0c0d0e0f1122330102030405060708090a0b0c')

  const outputs = [
    new BoostOutput(jobContractV1, 1, txid, 1),
    new BoostOutput(jobContractV2, 1, txid, 2),
    new BoostOutput(jobBountyV1, 1, txid, 3),
    new BoostOutput(jobBountyV2, 1, txid, 4)]

  it("mining.subscribe should return the correct response for the unexteded protocol", async () => {
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

    let response = await handle({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    expect(SubscribeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it("mining.configure should return the correct response for extensions not supported", async () => {
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

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
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

    let response = await handle({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    expect(AuthorizeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it("mining.authorize cannot be called twice", async () => {
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

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
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

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
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

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
    let jobs = job_manager([], new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true, {
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
    let jobs = job_manager(outputs, new bsv.PrivKey(new bsv.Bn(1234567), true), 1)
    let handle = handleStratumRequest(server_session(jobs.subscribe, true))

    let response = await handle({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({'subscribe_extranonce': {}})
    })

    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(false)

  })

})
