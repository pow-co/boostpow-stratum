import {MessageID} from '../src/Stratum/messageID'
import {SessionID} from '../src/Stratum/sessionID'
import {Error} from '../src/Stratum/error'
import {method} from '../src/Stratum/method'
import {Request} from '../src/Stratum/request'
import {Response, BooleanResponse} from '../src/Stratum/response'
import {Notification} from '../src/Stratum/notification'
import {AuthorizeRequest} from '../src/Stratum/mining/authorize'
import {GetVersionRequest, GetVersionResponse} from '../src/Stratum/client/get_version'
import {ShowMessage} from '../src/Stratum/client/show_message'
import {SetDifficulty} from '../src/Stratum/mining/set_difficulty'
import {extranonce, Extranonce, SetExtranonce} from '../src/Stratum/mining/set_extranonce'
import {SetVersionMask} from '../src/Stratum/mining/set_version_mask'
import {SubmitRequest, Share} from '../src/Stratum/mining/submit'
import {Notify, NotifyParams} from '../src/Stratum/mining/notify'
import {SubscribeRequest, SubscribeResponse, subscriptions} from '../src/Stratum/mining/subscribe'
import {prove} from '../src/Stratum/proof'
import {ConfigureRequest, ConfigureResponse} from '../src/Stratum/mining/configure'
import * as boostpow from 'boostpow'

import { expect } from './utils'

describe("Stratum Messages", () => {
  it("should distinguish valid and invalid message ids", async () => {
    var undefined_id
    expect(MessageID.valid(undefined_id)).to.be.equal(false)
    expect(MessageID.valid("meepmeep")).to.be.equal(true)
    expect(MessageID.valid(123)).to.be.equal(true)
    expect(MessageID.valid(-34)).to.be.equal(true)
    expect(MessageID.valid(2/3)).to.be.equal(false)
  })

  it("should distinguish valid and invalid session ids", async () => {
    expect(SessionID.valid("abcdef01")).to.be.equal(true)
    expect(SessionID.valid("abcdefg1")).to.be.equal(false)
    // TODO I don't understand why this test fails -- Daniel
    expect(SessionID.valid("abcdef01a")).to.be.equal(false)
    expect(SessionID.valid("bcdef01")).to.be.equal(false)
  })

  it("should distinguish valid and invalid errors", async () => {
    var undefined_error
    expect(Error.valid(undefined_error)).to.be.equal(false)
    expect(Error.valid(null)).to.be.equal(true)
    expect(Error.valid([1, "noob"])).to.be.equal(true)
  })

  it("should distinguish valid and invalid requests", async () => {
    expect(Request.read({id:3, method:'mining.authorize', params:[]})).to.be.not.equal(undefined)
    expect(Request.read({id:null, method:'mining.authorize', params:[]})).to.be.equal(undefined)
    expect(Request.read({id:"3", method:'mining.authorize', params:[true, {}, ""]})).to.be.not.equal(undefined)
    let x
    expect(Request.read({id:3, method:'mining.authorize', params:[x]})).to.be.equal(undefined)
  })

  it("should distinguish valid and invalid responses", async () => {
    expect(Response.valid({id:3, result:[], err:null})).to.be.equal(true)
    expect(Response.valid({id:3, result:null, err:null})).to.be.equal(true)
    expect(Response.valid({id:3, result:{}, err:null})).to.be.equal(true)
    expect(Response.valid({id:"3", result:[true, {}, ""], err:null})).to.be.equal(true)
    let x
    expect(Response.valid({id:3, result:x, err:null})).to.be.equal(false)

    expect(BooleanResponse.valid({id:3, result:true, err:null})).to.be.equal(true)
    expect(BooleanResponse.valid({id:3, result:null, err:[1, "nuffin"]})).to.be.equal(true)
  })

  it("should distinguish valid and invalid notifications", async () => {
    expect(Notification.read({id:null, method:'mining.notify', params:[]})).to.be.not.equal(undefined)
    expect(Notification.read({id:3, method:'mining.notify', params:[]})).to.be.equal(undefined)
    expect(Notification.read({id:null, method:'mining.notify', params:[true, {}, ""]})).to.be.not.equal(undefined)
    let x
    expect(Notification.read({id:null, method:'mining.notify', params:[x]})).to.be.equal(undefined)
  })

  it("should distinguish valid and invalid authorize messages", async () => {
    expect(AuthorizeRequest.valid({id:"x", method: 'mining.authorize', params: ["abcd"]})).to.be.equal(true)
    expect(AuthorizeRequest.valid({id:"x", method: 'mining.authorize', params: ["abcd", "xyzt"]})).to.be.equal(true)
    expect(AuthorizeRequest.valid({id:"x", method: 'mining.subscribe', params: ["abcd"]})).to.be.equal(false)
  })

  it("should read authorize request values", async () => {
    expect(AuthorizeRequest.username({id:"x", method: 'mining.authorize', params: ["abcd"]})).to.be.equal("abcd")
    expect(AuthorizeRequest.password({id:"x", method: 'mining.authorize', params: ["abcd"]})).to.be.equal(undefined)
    expect(AuthorizeRequest.password({id:"x", method: 'mining.authorize', params: ["abcd", "xyzt"]})).to.be.equal("xyzt")
  })

  it("should distinguish valid and invalid get_version messages", async () => {
    expect(GetVersionRequest.valid({id:'a', method: 'client.get_version', params: []})).to.be.equal(true)
    expect(GetVersionRequest.valid({id:'a', method: '', params: []})).to.be.equal(false)
    expect(GetVersionResponse.valid({id:'a', result: "3", err: null})).to.be.equal(true)
  })

  it("should read get_version values", async () => {
    expect(GetVersionResponse.version({id:'a', result: "3", err: null})).to.be.equal("3")
  })

  it("should distinguish valid and invalid show_message messages", async () => {
    expect(ShowMessage.valid({id:null, method: 'client.show_message', params: ['message']})).to.be.equal(true)
    expect(ShowMessage.valid({id:null, method: '', params: ['message']})).to.be.equal(false)
  })

  it("should read show_message message", async () => {
    expect(ShowMessage.message({id:null, method: 'client.show_message', params: ['message']})).to.be.equal('message')
  })

  it("should distinguish valid and invalid set_extranonce messages", async () => {
    expect(SetExtranonce.valid({id:null, method: 'mining.set_extranonce', params: ["00000000", 8]})).to.be.equal(true)
    expect(SetExtranonce.valid({id:null, method: 'mining.set_extranonce', params: ["00000000", 2.2]})).to.be.equal(false)
    expect(SetExtranonce.valid({id:null, method: 'mining.set_extranonce', params: ["000000000", 8]})).to.be.equal(false)
    expect(SetExtranonce.valid({id:null, method: '', params: ["00000000", 8]})).to.be.equal(false)
  })

  it("should distinguish valid and invalid set_version_mask messages", async () => {
    expect(SetVersionMask.valid({id:null, method: 'mining.set_version_mask', params: ["00000000"]})).to.be.equal(true)
    expect(SetVersionMask.valid({id:null, method: 'mining.set_version_mask', params: ["000000000"]})).to.be.equal(false)
    expect(SetVersionMask.valid({id:null, method: '', params: ["00000000"]})).to.be.equal(false)
  })

  it("should distinguish valid and invalid set_difficulty messages", async () => {
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: [1]})).to.be.equal(true)
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: [1.1]})).to.be.equal(true)
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: []})).to.be.equal(false)
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: [""]})).to.be.equal(false)
    expect(SetDifficulty.valid({id:null, method: '', params: [1]})).to.be.equal(false)
  })

  it("should read set_difficulty values", async () => {
    let diffA = new boostpow.Difficulty(1)
    let diffB = new boostpow.Difficulty(1.1)

    expect(SetDifficulty.difficulty(SetDifficulty.make(diffA)).bits).to.be.equal(diffA.bits)
    expect(SetDifficulty.difficulty(SetDifficulty.make(diffB)).bits).to.be.equal(diffB.bits)
    expect(SetDifficulty.difficulty(SetDifficulty.make(diffA)).bits).to.be.not.equal(diffB.bits)
    expect(SetDifficulty.difficulty(SetDifficulty.make(diffB)).bits).to.be.not.equal(diffA.bits)
  })

  it("should distinguish valid and invalid subscribe request messages", async () => {
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: [""]})).to.be.equal(true)
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: ["", "00000000"]})).to.be.equal(true)
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: []})).to.be.equal(true)
    expect(SubscribeRequest.valid({id:55, method: '', params: [""]})).to.be.equal(false)
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: ["", "000000000"]})).to.be.equal(false)
  })

  it("should read subscribe request parameters", async () => {
    let sx = boostpow.UInt32Big.fromHex("00000001")

    expect(SubscribeRequest.userAgent(SubscribeRequest.make(777, "noob", sx))).to.be.equal("noob")
    expect(SubscribeRequest.extranonce1(SubscribeRequest.make(777, "noob", sx)).hex).to.be.equal(sx.hex)
    expect(SubscribeRequest.extranonce1(SubscribeRequest.make(777, "noob"))).to.be.equal(undefined)
  })

  it("should distinguish valid and invalid subscribe response messages", async () => {
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "00000001", 8]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[["mining.notify", "abcd"]], "00000001", 8]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[["mining.notify", "abcd"], ["mining.set_extranonce", "xyzt"]], "00000001", 8]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "000000010", 8]})).to.be.equal(false)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "00000001", 0]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "00000001", 1.34]})).to.be.equal(false)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[["mining.crapify", "abcd"]], "00000001", 8]})).to.be.equal(false)
    expect(SubscribeResponse.valid(SubscribeResponse.make_error(55, [99, "mooo"]))).to.be.equal(true)
  })

  it("should read subscribe response parameters", async () => {
    let sx = boostpow.UInt32Big.fromHex("00000001")
    let subs: subscriptions = [["mining.subscribe", "nahanana"]]
    let response = SubscribeResponse.make_subscribe(777, subs, sx, 8)

    expect(SubscribeResponse.subscriptions(response)).to.be.equal(subs)
    expect(SubscribeResponse.extranonce1(response).hex).to.be.equal(sx.hex)
    expect(SubscribeResponse.extranonce2size(response)).to.be.equal(8)
  })

  it("should distinguish valid and invalid submit request messages", async () => {
    expect(SubmitRequest.valid({id:55, method: 'mining.submit',
      params: ["daniel", "abcd", "00000000", "00000001",
        "00000000000000000000000000000001"]})).to.be.equal(true)
    expect(SubmitRequest.valid({id:55, method: 'mining.submit',
      params: ["daniel", "abcd", "00000000", "00000001",
        "00000000000000000000000000000001", "00000000"]})).to.be.equal(true)
    expect(SubmitRequest.valid({id:55, method: '',
      params: ["daniel", "abcd", "00000000", "00000001",
        "00000000000000000000000000000001", "00000000"]})).to.be.equal(false)
  })

  it("should read submit request parameters", async () => {
    let worker_name = "daniel"
    let job_id = "abcd"
    let timestamp = boostpow.UInt32Little.fromNumber(3)
    let nonce = boostpow.UInt32Little.fromNumber(4)
    let en2 = boostpow.Bytes.fromHex("0000000000000001")
    let version = boostpow.Int32Little.fromNumber(23)
    let share = Share.make(worker_name, job_id, timestamp, nonce, en2, version)
    expect(Share.workerName(share)).to.be.equal(worker_name)
    expect(Share.jobID(share)).to.be.equal(job_id)
    expect(Share.timestamp(share).hex).to.be.equal(timestamp.hex)
    expect(Share.nonce(share).hex).to.be.equal(nonce.hex)
    expect(Share.extranonce2(share).hex).to.be.equal(en2.hex)
    expect(Share.generalPurposeBits(share).hex).to.be.equal(version.hex)
  })

  it("should distinguish valid and invalid notify messages", async () => {
    expect(Notify.valid({id:null, method: 'mining.notify',
      params: ["abcd",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "abcdef", "abcdef", [], "00000002", "00000003", "00000004", false]})).to.be.equal(true)
    expect(Notify.valid({id:null, method: '',
      params: ["abcd",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "abcdef", "abcdef", [], "00000002", "00000003", "00000004", false]})).to.be.equal(false)
  })

  it("should read properties of notify messages", async () => {
    let prevHash = boostpow.Digest32.fromHex("0000000000000000000000000000000000000000000000000000000000000001")
    let gentx1 = boostpow.Bytes.fromHex("abcdef")
    let gentx2 = boostpow.Bytes.fromHex("010203")
    let version = boostpow.Int32Little.fromNumber(2)
    let time = boostpow.UInt32Little.fromNumber(3)
    let d = new boostpow.Difficulty(.001)
    expect(NotifyParams.jobID(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal("abcd")
    expect(NotifyParams.prevHash(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false)).hex).to.be.equal(prevHash.hex)
    expect(NotifyParams.generationTX1(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false)).hex).to.be.equal(gentx1.hex)
    expect(NotifyParams.merkleBranch(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false)).length).to.be.equal(0)
    expect(NotifyParams.version(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false)).hex).to.be.equal(version.hex)
    expect(NotifyParams.nbits(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false)).bits).to.be.equal(d.bits)
    expect(NotifyParams.time(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false)).hex).to.be.equal(time.hex)
    expect(NotifyParams.clean(NotifyParams.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(false)
  })

  it("should distinguish valid and invalid configure request messages", async () => {
    expect(ConfigureRequest.valid({id:9, method: 'mining.configure', params: [[], {}]})).to.be.equal(true)
    expect(ConfigureRequest.valid({id:9, method: '', params: [[], {}]})).to.be.equal(false)
    expect(ConfigureRequest.valid({id:9, method: 'mining.configure', params:
      [['version-rolling', 'minimum-difficulty', 'subscribe-extranonce', 'info', 'unknown-extension'], {
        'version-rolling.mask': '0f0f0f0f', 'version-rolling.min-bit-count': 2,
        'minimum-difficulty.value': 3,
        'info.connection-url': "connectionUrl",
        'info.hw-version': "HWVersion",
        'info.sw-version': "SWVersion",
        'info.hw-id': "mooo", "unknown-extension.unknown-parameter": 35}]})).to.be.equal(true)

    // should fail because a required paramer is missing.
    expect(ConfigureRequest.valid({id:9, method: 'mining.configure', params:
      [['version-rolling', 'minimum-difficulty', 'subscribe-extranonce'], {
        'version-rolling.mask': '0f0f0f0f',
        'minimum-difficulty.value': 3}]})).to.be.equal(false)

    expect(ConfigureRequest.valid({id:9, method: 'mining.configure', params:
      [['version-rolling', 'minimum-difficulty', 'subscribe-extranonce', 'info', 'unknown-extension'], {
        'version-rolling.mask': '0f0f0f0f', 'version-rolling.min-bit-count': 2,
        'minimum-difficulty.value': 3,
        'info.connection-url': "connectionUrl",
        'info.hw-version': "HWVersion",
        'info.hw-id': "mooo", "unknown-extension.unknown-parameter": 35}]})).to.be.equal(true)

    expect(ConfigureRequest.valid({id:9, method: 'mining.configure', params:
      [['version-rolling', 'minimum-difficulty', 'subscribe-extranonce'], {
        'version-rolling.mask': '0f0f0f0f',
        'minimum-difficulty.value': "3"}]})).to.be.equal(false)
  })

  it("should distinguish valid and invalid configure response messages", async () => {
    expect(ConfigureResponse.valid({id:9, err: null, result:{
      'version-rolling':true, 'minimum-difficulty':true,
      'subscribe-extranonce':true, 'info':false,
      'unknown-extension': 'we do not support this extension',
      'version-rolling.mask': '0f0f0f0f'
    }})).to.be.equal(true)

    expect(ConfigureResponse.valid({id:9, err: null, result:{
      'version-rolling':true, 'minimum-difficulty':true,
      'subscribe-extranonce':true, 'info':false,
      'unknown-extension.value': 3,
      'version-rolling.mask': '0f0f0f0f'
    }})).to.be.equal(false)
  })

  it("should construct proofs from the notify, subscribe, and submit messages", async () => {
    let en1 = boostpow.UInt32Big.fromNumber(1)
    let n: extranonce = [en1.hex, 8]

    let job_id = "abcd"

    let d = new boostpow.Difficulty(.0001)
    let prevHash = boostpow.Digest32.fromHex("0000000000000000000000000000000000000000000000000000000000000001")
    let gentx1 = boostpow.Bytes.fromHex("abcdef")
    let gentx2 = boostpow.Bytes.fromHex("010203")
    let version = boostpow.Int32Little.fromNumber(2)
    let timestamp = boostpow.UInt32Little.fromNumber(3)
    let notify = Notify.make(job_id, prevHash, gentx1, gentx2, [], version, d, timestamp, false)['params']

    let worker_name = "daniel"
    let nonce_false = boostpow.UInt32Little.fromNumber(555)
    let nonce_true_v1 = boostpow.UInt32Little.fromNumber(65067)
    let nonce_true_v2 = boostpow.UInt32Little.fromNumber(449600)
    let extra_nonce_2 = boostpow.Bytes.fromHex("abcdef0123456789")
    let extra_nonce_2_big = boostpow.Bytes.fromHex("abcdef012345678900")
    let gpr = boostpow.Int32Little.fromHex("ffffffff")

    let submit_wrong_job_id = SubmitRequest.make(777, worker_name, "xyzt", timestamp, nonce_true_v2, extra_nonce_2, gpr)['params']
    let submit_wrong_size = SubmitRequest.make(777, worker_name, job_id, timestamp, nonce_true_v2, extra_nonce_2_big, gpr)['params']
    let submit_true_v1 = SubmitRequest.make(777, worker_name, job_id, timestamp, nonce_true_v1, extra_nonce_2)['params']
    let submit_true_v2 = SubmitRequest.make(777, worker_name, job_id, timestamp, nonce_true_v2, extra_nonce_2, gpr)['params']
    let submit_false_v1 = SubmitRequest.make(777, worker_name, job_id, timestamp, nonce_false, extra_nonce_2)['params']
    let submit_false_v2 = SubmitRequest.make(777, worker_name, job_id, timestamp, nonce_false, extra_nonce_2, gpr)['params']

    let version_mask = boostpow.Int32Little.fromNumber(boostpow.Utils.generalPurposeBitsMask()).hex

    expect(prove(n, notify, submit_wrong_job_id, version_mask)).to.be.equal(undefined)
    expect(prove(n, notify, submit_wrong_size, version_mask)).to.be.equal(undefined)

    expect(prove(n, notify, submit_true_v1, version_mask)).to.be.equal(undefined)
    expect(prove(n, notify, submit_true_v2)).to.be.equal(undefined)

    let pf1 = prove(n, notify, submit_false_v1)
    let pf2 = prove(n, notify, submit_false_v2, version_mask)

    expect(pf1).to.be.not.equal(undefined)
    expect(pf2).to.be.not.equal(undefined)

    expect(pf1.valid()).to.be.equal(false)
    expect(pf2.valid()).to.be.equal(false)

    let pt1 = prove(n, notify, submit_true_v1)
    let pt2 = prove(n, notify, submit_true_v2, version_mask)

    expect(pt1).to.be.not.equal(undefined)
    expect(pt2).to.be.not.equal(undefined)

    expect(pt1.Puzzle.Mask).to.be.equal(undefined)
    expect(pt2.Puzzle.Mask).to.be.not.equal(undefined)

    expect(pt1.Solution.GeneralPurposeBits).to.be.equal(undefined)
    expect(pt2.Solution.GeneralPurposeBits).to.be.not.equal(undefined)

    expect(pt1.valid()).to.be.equal(true)
    expect(pt2.valid()).to.be.equal(true)
  })

  it("should construct proofs from notify, subscribe, and submit (standard test case from the web)", async () => {

    let notify = JSON.parse('{"params":'+
      '["bf", "4d16b6f85af6e2198f44ae2a6de67f78487ae5611b77c6c0440b921e00000000",' +
        '"01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff20020862062f503253482f04b8864e5008",' +
        '"072f736c7573682f000000000100f2052a010000001976a914d23fcdf86f7e756a64a7a9688ef9903327048ed988ac00000000",' +
        '[], "00000002", "1c2ac4af", "504e86b9", false],' +
      '"id": null, "method": "mining.notify"}')

    let expected_prev_hash = "f8b6164d19e2f65a2aae448f787fe66d61e57a48c0c6771b1e920b4400000000"
    console.log("expected prev hash: ", expected_prev_hash)
    let prev_hash = NotifyParams.prevHash(notify.params).buffer.toString('hex')
    console.log("         prev hash: ", prev_hash)
    expect(prev_hash).to.be.equal(expected_prev_hash)

    let subscribe_response = JSON.parse('{"id": 1, "result": ' +
      '[ [ ["mining.set_difficulty", "b4b6693b72a50c7116db18d6497cac52"], ' +
      '["mining.notify", "ae6812eb4cd7735a302a8a9dd95cf71f"]], "08000002", 4], ' +
      '"error": null}')
    let en = <extranonce>[subscribe_response.result[1], subscribe_response.result[2]]

    let submit_request = JSON.parse('{"params": ' +
      '["slush.miner1", "bf", "00000001", "504e86ed", "b2957c02"],' +
      '"id": 4, "method": "mining.submit"}')

    let proof = prove(en, notify.params, submit_request.params)
    expect(proof.valid()).to.be.equal(true)
    let z = proof.string()
    console.log("zstring: ", z.toString())
    expect(z.hash.buffer).to.be.equal(Buffer.from("32abdc31d947623a2482144f92dbc092a84fd8ee6e2b5ae60f87762000000000", 'hex'))

  })
})
