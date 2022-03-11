import {MessageID} from '../src/Stratum/messageID'
import {SessionID} from '../src/Stratum/sessionID'
import {Error} from '../src/Stratum/error'
import {method} from '../src/Stratum/method'
import {Request} from '../src/Stratum/request'
import {Response, BooleanResponse} from '../src/Stratum/response'
import {Notification} from '../src/Stratum/notification'
/*import {AuthorizeRequest} from '../src/Stratum/mining/authorize'
import {SubmitRequest} from '../src/Stratum/mining/submit'
import {GetVersionRequest, GetVersionResponse} from '../src/Stratum/client/get_version'
import {ShowMessage} from '../src/Stratum/client/show_message'
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

  })

  it("should distinguish valid and invalid subscribe messages", async () => {

  })

  it("should distinguish valid and invalid configure messages", async () => {

  })

  it("should distinguish valid and invalid submit messages", async () => {

  })

  it("should distinguish valid and invalid notify messages", async () => {

  })

  it("should distinguish valid and invalid set_extranonce messages", async () => {

  })

  it("should distinguish valid and invalid set_difficulty messages", async () => {

  })

  it("should distinguish valid and invalid set_version_mask messages", async () => {

  })

  it("should distinguish valid and invalid get_version messages", async () => {

  })

  it("should distinguish valid and invalid show_message messages", async () => {

  })

  it("should construct proofs from the notify, subscribe, and submit messages", async () => {

  })

})
