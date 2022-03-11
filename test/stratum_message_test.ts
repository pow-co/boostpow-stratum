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
/*import {SubmitRequest} from '../src/Stratum/mining/submit'
import {Notify} from '../src/Stratum/mining/notify'
import {SetDifficulty} from '../src/Stratum/mining/set_difficulty'
import {SetExtranonce} from '../src/Stratum/mining/set_extranonce'
import {SetVersionMask} from '../src/Stratum/mining/set_version_mask'
import {SubscribeRequest, SubscribeResponse} from '../src/Stratum/mining/subscribe'*/
//import {ConfigureRequest, ConfigrueResponse} from '../src/Stratum/mining/configure'

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
    expect(AuthorizeRequest.username({id:"x", method: 'mining.authorize', params: ["abcd"]})).to.be.equal("abcd")
    expect(AuthorizeRequest.password({id:"x", method: 'mining.authorize', params: ["abcd"]})).to.be.equal(undefined)
    expect(AuthorizeRequest.password({id:"x", method: 'mining.authorize', params: ["abcd", "xyzt"]})).to.be.equal("xyzt")
  })

  it("should distinguish valid and invalid get_version messages", async () => {
    expect(GetVersionRequest.valid({id:'a', method: 'client.get_version', params: []})).to.be.equal(true)
    expect(GetVersionResponse.valid({id:'a', result: "3", err: null})).to.be.equal(true)
    expect(GetVersionResponse.version({id:'a', result: "3", err: null})).to.be.equal("3")
  })

  it("should distinguish valid and invalid show_message messages", async () => {
    expect(ShowMessage.valid({id:null, method: 'client.show_message', params: ['message']})).to.be.equal(true)
    expect(ShowMessage.message({id:null, method: 'client.show_message', params: ['message']})).to.be.equal('message')
  })

  it("should distinguish valid and invalid submit messages", async () => {
    //expect(SubmitRequest.valid()).to.be.equal(true)
  })

  it("should distinguish valid and invalid subscribe messages", async () => {
    //expect(SubscribeRequest.valid()).to.be.equal(true)
    //expect(SubscribeResponse.valid()).to.be.equal(true)
  })

  it("should distinguish valid and invalid set_extranonce messages", async () => {
    //expect(SetExtranonce.valid()).to.be.equal(true)
  })

  it("should distinguish valid and invalid set_difficulty messages", async () => {
    //expect(SetDifficulty.valid()).to.be.equal(true)
  })

  it("should distinguish valid and invalid set_version_mask messages", async () => {
    //expect(SetVersionMask.valid()).to.be.equal(true)
  })

  it("should distinguish valid and invalid configure messages", async () => {

  })

  it("should distinguish valid and invalid notify messages", async () => {
    //expect(Notify.valid()).to.be.equal(true)
  })

  it("should construct proofs from the notify, subscribe, and submit messages", async () => {

  })

})
