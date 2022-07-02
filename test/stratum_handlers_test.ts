import { expect } from './utils'
import { JSONValue } from '../src/json'
import { server_session } from '../src/server_session'
import { extensionHandlers, versionRollingHandler } from '../src/extensions'
import { message_id } from '../src/Stratum/messageID'
import { response, Response, BooleanResponse } from '../src/Stratum/response'
import { Notification } from '../src/Stratum/notification'
import { Error } from '../src/Stratum/error'
import { StratumResponse } from '../src/Stratum/handlers/base'
import { SubscribeResponse } from '../src/Stratum/mining/subscribe'
import { ConfigureResponse, Extensions } from '../src/Stratum/mining/configure'
import { AuthorizeResponse } from '../src/Stratum/mining/authorize'
import { SetDifficulty } from '../src/Stratum/mining/set_difficulty'
import { Notify, notify_params } from '../src/Stratum/mining/notify'
import { work_puzzle, prove, Proof } from '../src/Stratum/proof'
import { stratum } from '../src/stratum'
import { job_manager } from '../src/jobs'
import { extranonce, SetExtranonce } from '../src/Stratum/mining/set_extranonce'
import { Share } from '../src/Stratum/mining/submit'
import { private_key_wallet, nonfunctional_network, privKeyToAddress } from '../src/bitcoin'
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

  let key = bsv.PrivKey.fromWif('KwKYRBpVWEYdQeA4uRGAu959BN4M1WpaTuetwsoBYES8CrVkxfLt')
  let minerPubKeyHash = privKeyToAddress(key)

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
    minerPubKeyHash: minerPubKeyHash.hex,
  })

  const jobContractV2 = boostpow.Job.fromObject({
    category: categoryHex,
    content: contentHex,
    diff: difficulty,
    tag: tagHex,
    additionalData: dataHex,
    userNonce: userNonceHex,
    minerPubKeyHash: minerPubKeyHash.hex,
    useGeneralPurposeBits: true
  })

  let txid = boostpow.Digest32.fromHex('abcdef0a0b0c0d0e0f1122330102030405060708090a0b0c')

  const outputs = [
    new boostpow.Output(jobContractV1, 1, txid, 1),
    new boostpow.Output(jobContractV2, 1, txid, 2),
    new boostpow.Output(jobBountyV1, 1, txid, 3),
    new boostpow.Output(jobBountyV2, 1, txid, 4)]

  let wallet = private_key_wallet(key)

  let network = nonfunctional_network()

  let time_now = boostpow.UInt32Little.fromNumber(151007250)
  let time_too_early = boostpow.UInt32Little.fromNumber(151007250 - 100000)
  let time_too_late = boostpow.UInt32Little.fromNumber(151007250 + 100000)
  let now = () => time_now

  let worker_name: string = 'daniel'

  it("mining.subscribe should return a subscribe response and a new job using the unexteded protocol", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}))(dummy.connection)

    send({
      id: 2,
      method: 'mining.subscribe',
      params: [worker_name]
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

  it("mining.configure should return an error when extensions are not supported", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}))(dummy.connection)

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

  it("mining.authorize should return true", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: [worker_name]
    })

    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(AuthorizeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it("mining.authorize cannot be called twice", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: [worker_name]
    })

    send({
      id: 3,
      method: 'mining.authorize',
      params: [worker_name]
    })

    dummy.end.read()
    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(Error.is_error(response.err)).to.equal(true)
  })

  it("mining.subscribe cannot be called twice", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: [worker_name]
    })

    send({
      id: 3,
      method: 'mining.authorize',
      params: [worker_name]
    })

    dummy.end.read()
    let response = Response.read(dummy.end.read())
    expect(response).to.not.equal(undefined)
    expect(Error.is_error(response.err)).to.equal(true)
  })

  it("cannot reuse message ids", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}))(dummy.connection)

    send({
      id: 2,
      method: 'mining.authorize',
      params: [worker_name]
    })

    send({
      id: 2,
      method: 'mining.subscribe',
      params: [worker_name]
    })

    let response1 = Response.read(dummy.end.read())
    let response2 = Response.read(dummy.end.read())
    expect(response2).to.not.equal(undefined)
    expect(Error.is_error(response2.err)).to.equal(true)
  })

  it("mining.configure returns an empty response back upon an empty configure message when extensions are supported", async () => {
    let jobs = job_manager(outputs, wallet, network, 1);
    let dummy = dummyConnection();
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection);

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

  it('mining.configure returns a negative response for non-supoported extentions', async () => {
    let jobs = job_manager(outputs, wallet, network, 1);
    let dummy = dummyConnection();
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection);

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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.subscribe',
      params: [worker_name]
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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.subscribe',
      params: [worker_name]
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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true},
      extensionHandlers))(dummy.connection)

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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}, {
      'version_rolling': versionRollingHandler(-256*256)
    }))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        "version_rolling": {
          "mask":"ffff0000",
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
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}, {
      'version_rolling': versionRollingHandler(-256)
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
    expect(response.result['version_rolling.mask']).to.equal("00ffffff");
  })

  it("mining.subscribe should return the correct response for the extended protocol", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true}, extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        'subscribe_extranonce': {}})
    })

    let response1 = Response.read(dummy.end.read())
    expect(response1).to.not.equal(undefined)
    expect(ConfigureResponse.valid(response1)).to.equal(true)
    expect(Response.is_error(response1)).to.equal(false)

    send({
      id: 3,
      method: 'mining.subscribe',
      params: [worker_name]
    })

    let response2 = Response.read(dummy.end.read())
    expect(response2).to.not.equal(undefined)
    expect(SubscribeResponse.valid(response2)).to.equal(true)
    expect(Response.error(response2)).to.equal(null)

    expect(response2.result[0].length).to.equal(3)

    // we should get 2 notifications here.
    expect(dummy.end.read()).to.not.equal(undefined)
    expect(dummy.end.read()).to.not.equal(undefined)

  })

  let extra_nonce_1_hex: string = "02000000"
  let extra_nonce_1 = boostpow.UInt32Big.fromHex(extra_nonce_1_hex)

  let extra_nonce_2_v1: boostpow.Bytes = boostpow.Bytes.fromHex("0000000300000003");
  let extra_nonce_2_v2: boostpow.Bytes = boostpow.Bytes.fromHex("0000000000000000000000000000000000000000000000000000000300000003");

  let nonce_v1 = boostpow.UInt32Little.fromNumber(151906)
  let nonce_v2 = boostpow.UInt32Little.fromNumber(2768683)

  it("mining.submit original protocol", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true, nowSeconds: now},
      extensionHandlers))(dummy.connection)

    send({
      id: 3,
      method: 'mining.subscribe',
      params: [worker_name, extra_nonce_1.hex]
    })

    let subscribe_result = Response.read(dummy.end.read()).result

    let en: extranonce = <extranonce>[subscribe_result[1], subscribe_result[2]]

    // this should be a set difficulty.
    dummy.end.read()
    let np: notify_params = Notification.read(dummy.end.read()).params

    // construct the proofs that we will return.
    let valid_share = Share.make(worker_name, np[0], time_now, nonce_v1, extra_nonce_2_v1)
    let invalid_share = Share.make(worker_name, np[0], time_now, nonce_v2, extra_nonce_2_v1)

    let valid_proof = new Proof(en, np, valid_share)
    let invalid_proof = new Proof(en, np, invalid_share)

    expect(valid_proof.valid()).to.equal(true)
    expect(invalid_proof.valid()).to.equal(false)

    // check that early and late shares are not accepted.
    let unknown_job_share = Share.make(worker_name, 'invalid', time_now, nonce_v1, extra_nonce_2_v1)
    let early_share = Share.make(worker_name, np[0], time_too_early, nonce_v1, extra_nonce_2_v1)
    let late_share = Share.make(worker_name, np[0], time_too_late, nonce_v1, extra_nonce_2_v1)


    {
      send({
        id: 4,
        method: 'mining.submit',
        params: valid_share
      })

      let submit_response = Response.read(dummy.end.read())
      expect(submit_response).to.not.equal(undefined)
      expect(BooleanResponse.result(submit_response)).to.equal(true)
    }

    {
      send({
        id: 5,
        method: 'mining.submit',
        params: valid_share
      })

      let submit_response = Response.read(dummy.end.read())
      expect(submit_response).to.not.equal(undefined)
      expect(BooleanResponse.result(submit_response)).to.equal(true)
      expect(Response.error(submit_response)[0]).to.equal(22)
    }

    {
      send({
        id: 6,
        method: 'mining.submit',
        params: unknown_job_share
      })

      let submit_response = Response.read(dummy.end.read())
      expect(submit_response).to.not.equal(undefined)
      expect(BooleanResponse.result(submit_response)).to.equal(false)
      expect(Response.error(submit_response)[0]).to.equal(36)
    }

    {
      send({
        id: 7,
        method: 'mining.submit',
        params: early_share
      })

      let submit_response = Response.read(dummy.end.read())
      expect(submit_response).to.not.equal(undefined)
      expect(BooleanResponse.result(submit_response)).to.equal(false)
      expect(Response.error(submit_response)[0]).to.equal(31)
    }

    {
      send({
        id: 8,
        method: 'mining.submit',
        params: late_share
      })

      let submit_response = Response.read(dummy.end.read())
      expect(submit_response).to.not.equal(undefined)
      expect(BooleanResponse.result(submit_response)).to.equal(false)
      expect(Response.error(submit_response)[0]).to.equal(32)
    }

    {
      send({
        id: 9,
        method: 'mining.submit',
        params: invalid_share
      })

      let submit_response = Response.read(dummy.end.read())
      expect(submit_response).to.not.equal(undefined)
      expect(BooleanResponse.result(submit_response)).to.equal(false)
      expect(Response.error(submit_response)[0]).to.equal(34)
    }


  })

  it("mining.submit extended protocol", async () => {
    let jobs = job_manager(outputs, wallet, network, 1)
    let dummy = dummyConnection()
    let send = stratum(server_session(jobs.subscribe,
      {canSubmitWithoutAuthorization:true, nowSeconds: now},
      extensionHandlers))(dummy.connection)

    send({
      id: 2,
      method: 'mining.configure',
      params: Extensions.configure_request_params({
        'subscribe_extranonce': {},
        'version_rolling': {
          'mask': boostpow.Int32Little.fromNumber(boostpow.Utils.generalPurposeBitsMask()).hex,
          'min-bit-count': 8
        }})
    })

    let version_rolling_result = Extensions.extension_results(Response.read(dummy.end.read()).result).version_rolling
    expect(version_rolling_result[0]).to.equal(true)
    let version_mask = <string>version_rolling_result[1]['mask']
    expect(version_mask).to.not.equal(undefined)

    send({
      id: 3,
      method: 'mining.subscribe',
      params: [worker_name, extra_nonce_1.hex]
    })

    let subscribe_result = Response.read(dummy.end.read()).result

    // we may get an set_extranonce method. If we do, then there will be
    // two more notifications coming, one for set_difficulty and the other
    // for notify. Otherwise, we get the extra nonce from the subscribe
    // result and we only have one more notification coming.
    let n1 = Notification.read(dummy.end.read())
    let n2 = Notification.read(dummy.end.read())

    let en: extranonce
    let np: notify_params

    let en1 = SetExtranonce.read(n1)
    let en2 = SetExtranonce.read(n2)

    if (!!en1 || !!en2) {
      if (en1) {
        en = en1.params
      } else {
        en = en2.params
      }
      np = Notification.read(dummy.end.read()).params
    } else {
      en = <extranonce>[subscribe_result[1], subscribe_result[2]]
      np = n2.params
    }

    let gpr = boostpow.Int32Little.fromHex('ffffffff')

    let valid_share = Share.make(worker_name, np[0], time_now, nonce_v2, extra_nonce_2_v2, gpr)
    let invalid_share = Share.make(worker_name, np[0], time_now, nonce_v1, extra_nonce_2_v2, gpr)

    let valid_proof = new Proof(en, np, valid_share, version_mask)
    let invalid_proof = new Proof(en, np, invalid_share, version_mask)

    expect(valid_proof.valid()).to.equal(true)
    expect(invalid_proof.valid()).to.equal(false)

    send({
      id: 4,
      method: 'mining.submit',
      params: invalid_share
    })

    send({
      id: 5,
      method: 'mining.submit',
      params: valid_share
    })

    let submit_response_1 = Response.read(dummy.end.read())
    expect(submit_response_1).to.not.equal(undefined)
    expect(BooleanResponse.result(submit_response_1)).to.equal(false)

    let submit_response_2 = Response.read(dummy.end.read())
    expect(submit_response_2).to.not.equal(undefined)
    expect(BooleanResponse.result(submit_response_2)).to.equal(true)

  })

})
