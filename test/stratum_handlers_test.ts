import { expect } from './utils'
import { JSONValue } from '../src/json'
import { server_session } from '../src/server_session'
import { extensionHandlers, versionRollingHandler } from '../src/extensions'
import { message_id } from '../src/Stratum/messageID'
import { response, Response } from '../src/Stratum/response'
import { Error } from '../src/Stratum/error'
import { StratumResponse } from '../src/Stratum/handlers/base'
import { SubscribeResponse } from '../src/Stratum/mining/subscribe'
import { ConfigureResponse, Extensions } from '../src/Stratum/mining/configure'
import { AuthorizeResponse } from '../src/Stratum/mining/authorize'
import { SetDifficulty } from '../src/Stratum/mining/set_difficulty'
import { Notify } from '../src/Stratum/mining/notify'
import { stratum } from '../src/stratum'
import { BoostOutput, job_manager } from '../src/jobs'
import { private_key_wallet } from '../src/bitcoin'
import * as bsv from 'bsv'
import * as boostpow from 'boostpow'

function dummyConnection() {
  let open: boolean = true
  let messages: JSONValue[] = []
  let index = 0
  return {
    end: {
      read: (): undefined | JSONValue => {
        if (messages.length > index) {
          index++
          return messages[index - 1]
        }
      },
      closed: (): boolean => {
        return !open
      }
    },
    connection: {
      send: (j: JSONValue) => {
        if (open) messages.push(j)
      },
      close: () => {
        open = false
      }
    }
  }
}

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

  let wallet = private_key_wallet(new bsv.PrivKey(new bsv.Bn(1234567), true))

  it("mining.subscribe should return the correct response for the unexteded protocol", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(SubscribeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)

    // we should get two more messages at this point, one for set_difficulty and
    // another for notify.

    let notification1 = dummy.end.read()
    expect(notification1).to.not.equal(undefined)

    let notification2 = dummy.end.read()
    expect(notification2).to.not.equal(undefined)

    expect(
      (!!SetDifficulty.read(notification1) && !!Notify.read(notification2)) ||
      (!!SetDifficulty.read(notification2) && !!Notify.read(notification1))).to.equal(true)
  })

  it("mining.configure should return the correct response for extensions not supported", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      // we are not asking to support any extensions, but this version of the protocol
      // doesn't know about the configure message at all.
      params: [[], {}]
    })

    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(true)
  })

  it("mining.authorize should return the correct response", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(AuthorizeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it("mining.authorize cannot be called twice", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    send({
      id: 3,
      method: 'mining.authorize',
      params: ['daniel']
    })

    dummy.end.read()
    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(Error.is_error(response.err)).to.equal(true)
  })

  it("mining.subscribe cannot be called twice", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    send({
      id: 3,
      method: 'mining.authorize',
      params: ['daniel']
    })

    dummy.end.read()
    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(Error.is_error(response.err)).to.equal(true)
  })

  it("cannot reuse message ids", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: ['daniel']
    })

    send({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    let response1 = Response.read(dummy.end.read())
    let response2 = Response.read(dummy.end.read())
    expect(response2).to.not.equal(undefined)
    expect(Error.is_error(response2.err)).to.equal(true)
  })

  it("sends an empty response back upon supported extensions and a blank configure message", async () => {
    let jobs = job_manager(outputs, wallet, 1);
    let dummy = dummyConnection();
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection);
    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({

      })
    })

    let response = Response.read(dummy.end.read());
    expect(response.result).to.eql({});
    expect(Response.is_error(response)).to.eql(false)
  });

  it('Sends a negative response on non supoported extentions', async () => {
    let jobs = job_manager(outputs, wallet, 1);
    let dummy = dummyConnection();
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection);
    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
          "silly_extension": {"Sillyness": "Max"}
      })
    })
    let response = Response.read(dummy.end.read());
    expect(response.result).to.not.eql({})
    expect(response.result['silly_extension']).to.be.false;
    expect(Response.is_error(response)).to.be.false;
  });

  it("mining.configure should return the correct response for extensions supported", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        'subscribe_extranonce': {},
        'minimum_difficulty': {'value': 1},
        'version_rolling': {'mask': 'ffffffff', 'min-bit-count': 2}})
    })

    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(false)

    // TODO check that we have the correct results here.
  })

  it("Should accept a valid empty info extension", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "info": {}
    })});

      let response = Response.read(dummy.end.read());
      expect(response.result).to.haveOwnProperty('info');
      expect(response.result['info']).to.be.true;
      expect(Response.is_error(response)).to.not.be.true;
  })

  it("Should accept a valid info extension", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "info": {
          'hw-id': 42069
        }
      })});

    let response = Response.read(dummy.end.read());
    expect(response.result).to.haveOwnProperty('info');
    expect(response.result['info']).to.be.true;
    expect(Response.is_error(response)).to.not.be.true;
  })

  it("Should not accept an invalid info extension param",async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "info": {
          "silly_ext": 99
        }
      })});

    let response = Response.read(dummy.end.read());
    expect(response.result).to.haveOwnProperty('info')
    expect(response.result['info']).to.not.be.true;
    expect(response.result['info']).to.equal('invalid parameters');
  })

  it("mining.configure cannot be the second message", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    send({
      id: 3,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "info": {
        }
      })});
    dummy.end.read();
    dummy.end.read();
    dummy.end.read();
    let response = Response.read(dummy.end.read());
    expect(Response.is_error(response)).to.be.true;
    expect(response['err'][0]).to.equal(26);
  })

  it("mining.configure can't be the second message if it's only minimum_difficulty if first was not configure", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.subscribe',
      params: ['daniel']
    })

    send({
      id: 3,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "minimum_difficulty": {
          "value":10
        }
      })});
    dummy.end.read();
    dummy.end.read();
    dummy.end.read();

    let response = Response.read(dummy.end.read());
    expect(Response.is_error(response)).to.be.true;
    expect(response['err'][0]).to.equal(26);
  })

  it("mining.configure can be the second message if it's only minimum_difficulty if first was  configure", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "info": {
        },
        "minimum_difficulty": {
          "value":1
        }
      })
    })

    send({
      id: 3,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "minimum_difficulty": {
          "value":10
        }
      })});
    dummy.end.read();
    let response = Response.read(dummy.end.read());
    expect(Response.is_error(response)).to.be.false;
    expect(response.result).to.haveOwnProperty('minimum_difficulty');
    expect(response.result['minimum_difficulty']).to.be.true;
  })

  it("mining.configure sends an error if it can't support the right min bit count for version_rolling", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, {
      'version_rolling': versionRollingHandler(0xffff0000)
    }))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "version_rolling": {
          "mask":"0000ffff",
          "min-bit-count": 2
        }
      })
    })

    let response = Response.read(dummy.end.read());
    expect(Response.is_error(response)).to.be.false;
    expect(response.result).to.haveOwnProperty('version_rolling');
    expect(response.result['version_rolling']).to.be.eql('could not satisfy min-bit-count');
  })

  it("mining.configure works with a valid mask for version_rolling", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true, {
      'version_rolling': versionRollingHandler(0xffffff00)
    }))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "version_rolling": {
          "mask":"00ffffff",
          "min-bit-count": 8
        }
      })
    })

    let response = Response.read(dummy.end.read());
    expect(Response.is_error(response)).to.be.false;
    expect(response.result).to.haveOwnProperty('version_rolling');
    expect(response.result['version_rolling']).to.be.true;
    expect(response.result['version_rolling.mask']).to.equal(16776960);
  })

  it.skip("mining.subscribe should return the correct response for the extended protocol", async () => {
    let jobs = job_manager(outputs, wallet, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe, true))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({'subscribe_extranonce': {}})
    })

    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.is_error(response)).to.equal(false)

  })

})
