import { Request } from '../request'
import { Response, BooleanResponse, boolean_response } from '../response'
import { message_id } from '../messageID'
import { method } from '../method'
import { parameters } from '../message'

export type authorization = [string, string] | [string]

export type authorize_request = {
  id: message_id,
  method: method,
  params: authorization
}

export class AuthorizeRequest extends Request {

  static read_params(params: parameters): authorization | undefined {
    if ((params.length === 1 && typeof params[0] === 'string') ||
      (params.length === 2 && typeof params[0] === 'string' && typeof params[1] === 'string')) return <authorization>params
  }

  static valid(message: authorize_request): boolean {
    return message['method'] === 'mining.authorize' && this.read_params(message['params'])!=undefined
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

export { BooleanResponse as AuthorizeResponse }
