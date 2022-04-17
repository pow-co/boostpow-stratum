
import { expect } from './utils'
import { remote_client } from '../src/remote_client'
import { message_id } from '../src/Stratum/messageID'
import { response, Response } from '../src/Stratum/response'
import { SubscribeResponse } from '../src/Stratum/mining/subscribe'
import { ConfigureResponse } from '../src/Stratum/mining/configure'
import { AuthorizeResponse } from '../src/Stratum/mining/authorize'

function to_response(id: message_id, response: SubscribeResponse): response {
  Object.assign({id: id, err: null, result: null}, response)
  return <response>response
}

describe("Stratum Handlers Client -> Server -> Client", () => {

  it.skip("mining.subscribe should return the correct response for the unexteded protocol", async () => {
    let client_session = remote_client()
    let id: message_id = 2

    let response = to_response(id, await client_session['mining.subscribe']({
      id: id,
      method: 'mining.subscribe',
      params: ['daniel']
    }))

    expect(SubscribeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

  it.skip("mining.configure should return the correct response for extensions not supporteds", async () => {
    let client_session = remote_client()
    let id: message_id = 2

    let response = to_response(id, await client_session['mining.configure']({
      id: id,
      method: 'mining.configure',
      params: [[], {}]
    }))

    expect(ConfigureResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.not.equal(null)
  })

  it.skip("mining.authorize should return the correct response", async () => {
    let client_session = remote_client()
    let id: message_id = 2

    let response = to_response(id, await client_session['mining.authorize']({
      id: id,
      method: 'mining.authorize',
      params: ['daniel']
    }))

    expect(AuthorizeResponse.valid(response)).to.equal(true)
    expect(Response.error(response)).to.equal(null)
  })

})
