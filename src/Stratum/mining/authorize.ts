import { Request } from '../request'
import { Response, BooleanResponse, boolean_response } from '../response'
import { message_id } from '../messageID'
import { method } from '../method'

export type authorization = [string, string] | [string]

export type authorize_request = {
  id: message_id,
  method: method,
  params: authorization
}

export class AuthorizeRequest extends Request {

  static valid(message: authorize_request): boolean {
    return Request.valid(message) && message['method'] === 'mining.authorize'
  }

  static username(message: authorize_request): string {
    if (AuthorizeRequest.valid(message)) return message['params'][0]

    throw "invalid authorize request"
  }

  static password(message: authorize_request): string | undefined {
    if (AuthorizeRequest.valid(message)) return message['params'][1]

    throw "invalid authorize request"
  }

  static make(id: message_id, auth: authorization): authorize_request {
    return {id: id, method: 'mining.authorize', params: auth}
  }

}

export let AuthorizeResponse = BooleanResponse
