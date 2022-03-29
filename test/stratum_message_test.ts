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
import {extranonce, SetExtranonce} from '../src/Stratum/mining/set_extranonce'
import {SetVersionMask} from '../src/Stratum/mining/set_version_mask'
import {SubmitRequest} from '../src/Stratum/mining/submit'
import {Notify} from '../src/Stratum/mining/notify'
import {SubscribeRequest, SubscribeResponse} from '../src/Stratum/mining/subscribe'
import {Difficulty, UInt32Big, UInt32Little, Int32Little, Bytes, Digest32} from '../../../MatterPool/boostpow-js/lib/index'
//import {ConfigureRequest, ConfigureResponse} from '../src/Stratum/mining/configure'

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
    expect(Request.valid({id:3, method:'mining.authorize', params:[]})).to.be.equal(true)
    expect(Request.valid({id:null, method:'mining.authorize', params:[]})).to.be.equal(false)
    expect(Request.valid({id:"3", method:'mining.authorize', params:[true, {}, ""]})).to.be.equal(true)
    let x
    expect(Request.valid({id:3, method:'mining.authorize', params:[x]})).to.be.equal(false)
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
    expect(Notification.valid({id:null, method:'mining.notify', params:[]})).to.be.equal(true)
    expect(Notification.valid({id:3, method:'mining.notify', params:[]})).to.be.equal(false)
    expect(Notification.valid({id:null, method:'mining.notify', params:[true, {}, ""]})).to.be.equal(true)
    let x
    expect(Notification.valid({id:null, method:'mining.notify', params:[x]})).to.be.equal(false)
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
    expect(ShowMessage.valid({id:null, method: '', params: ['message']})).to.be.equal(true)
  })

  it("should read show_message message", async () => {
    expect(ShowMessage.message({id:null, method: 'client.show_message', params: ['message']})).to.be.equal('message')
    expect(ShowMessage.message({id:null, method: '', params: ['message']})).to.be.equal('message')
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
    expect(SetVersionMask.valid({id:null, method: '', params: ["00000000"]})).to.be.equal(true)
  })

  it("should distinguish valid and invalid set_difficulty messages", async () => {
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: [1]})).to.be.equal(true)
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: [1.1]})).to.be.equal(true)
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: []})).to.be.equal(false)
    expect(SetDifficulty.valid({id:null, method: 'mining.set_difficulty', params: [""]})).to.be.equal(false)
    expect(SetDifficulty.valid({id:null, method: '', params: [1]})).to.be.equal(false)
  })

  it("should read set_difficulty values", async () => {
    let diffA = new Difficulty(1)
    let diffB = new Difficulty(1.1)

    expect(SetDifficulty.difficulty(SetDifficulty.make(diffA))).to.be.equal(diffA)
    expect(SetDifficulty.difficulty(SetDifficulty.make(diffB))).to.be.equal(diffB)
    expect(SetDifficulty.difficulty(SetDifficulty.make(diffA))).to.be.not.equal(diffB)
    expect(SetDifficulty.difficulty(SetDifficulty.make(diffB))).to.be.not.equal(diffA)
  })

  it("should distinguish valid and invalid subscribe request messages", async () => {
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: [""]})).to.be.equal(true)
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: ["", "00000000"]})).to.be.equal(true)
    expect(SubscribeRequest.valid({id:55, method: '', params: [""]})).to.be.equal(false)
    expect(SubscribeRequest.valid({id:55, method: 'mining.subscribe', params: ["", "000000000"]})).to.be.equal(false)
  })

  it("should read subscribe request parameters", async () => {
    let sx = UInt32Big.fromHex("00000001")

    expect(SubscribeRequest.userAgent(SubscribeRequest.make(777, "noob", sx))).to.be.equal("noob")
    expect(SubscribeRequest.extranonce1(SubscribeRequest.make(777, "noob", sx))).to.be.equal(sx)
    expect(SubscribeRequest.extranonce1(SubscribeRequest.make(777, "noob"))).to.be.equal(undefined)
  })

  it("should distinguish valid and invalid subscribe response messages", async () => {
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "00000001", 8]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[["mining.notify", "abcd"]], "00000001", 8]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[["mining.notify", "abcd"], ["mining.set_extranonce", "xyzt"]], "00000001", 8]})).to.be.equal(true)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "000000010", 8]})).to.be.equal(false)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "00000001", 0]})).to.be.equal(false)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[], "00000001", 1.34]})).to.be.equal(false)
    expect(SubscribeResponse.valid({id:55, err: null, result: [[["mining.crapify", "abcd"]], "00000001", 8]})).to.be.equal(false)
    expect(SubscribeResponse.valid(SubscribeResponse.make_error(55, [99, "mooo"]))).to.be.equal(false)
  })

  it("should read subscribe response parameters", async () => {
    let sx = UInt32Big.fromHex("00000001")
    let subs = [["mining.subscribe", "nahanana"]]
    let response = SubscribeResponse.make_subscribe(777, subs, sx, 8)

    expect(SubscribeResponse.subscriptions(response)).to.be.equal(subs)
    expect(SubscribeResponse.extranonce1(response)).to.be.equal(sx)
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
    let timestamp = UInt32Little.fromNumber(3)
    let nonce = UInt32Little.fromNumber(4)
    let en2 = Bytes.fromHex("0000000000000001")
    let version = Int32Little.fromNumber(23)
    let message = SubmitRequest.make(777, worker_name, job_id, timestamp, nonce, en2, version)
    expect(SubmitRequest.workerName(message)).to.be.equal(worker_name)
    expect(SubmitRequest.jobID(message)).to.be.equal(job_id)
    expect(SubmitRequest.timestamp(message)).to.be.equal(timestamp)
    expect(SubmitRequest.nonce(message)).to.be.equal(nonce)
    expect(SubmitRequest.extranonce2(message)).to.be.equal(en2)
    expect(SubmitRequest.generalPurposeBits(message)).to.be.equal(version)
  })

  it("should distinguish valid and invalid notify messages", async () => {
    expect(Notify.valid({id:null, method: 'mining.notify',
      params: ["abcd",
        "000000000000000000000000000000000000000000000000000000000001",
        "abcdef", "abcdef", [], "00000002", "00000003", "00000004", false]})).to.be.equal(true)
  })

  it("should read properties of notify messages", async () => {
    let prevHash = Digest32.fromHex("000000000000000000000000000000000000000000000000000000000001")
    let gentx1 = Bytes.fromHex("abcdef")
    let gentx2 = Bytes.fromHex("010203")
    let version = Int32Little.fromNumber(2)
    let time = UInt32Little.fromNumber(3)
    let d = new Difficulty(.001)
    expect(Notify.jobID(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal("abcd")
    expect(Notify.prevHash(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(prevHash)
    expect(Notify.generationTX1(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(gentx1)
    expect(Notify.merkleBranch(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal([])
    expect(Notify.version(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(version)
    expect(Notify.nbits(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(d)
    expect(Notify.time(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(time)
    expect(Notify.clean(Notify.make("abcd", prevHash, gentx1, gentx2, [], version, d, time, false))).to.be.equal(false)
  })

  it("should construct proofs from the notify, subscribe, and submit messages", async () => {
    let en1 = UInt32Big.fromNumber(1)
    let n: extranonce = [en1.hex, 8]
    let job_id = "abcd"
    let prevHash = Digest32.fromHex("000000000000000000000000000000000000000000000000000000000001")
    let version = UInt32Little.fromNumber(2)
    let timestamp = UInt32Little.fromNumber(3)
    let nonce_false = UInt32Little.fromNumber(555)
  })

  it("should distinguish valid and invalid configure messages", async () => {

  })

})
