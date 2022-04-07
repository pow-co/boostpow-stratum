import { Request } from '../request'
import { Response } from '../response'
import { message_id } from '../messageID'
import { method } from '../method'
import { error } from '../error'

export type get_version_request = {
  id: message_id,
  method: method,
  params: []
}

export class GetVersionRequest extends Request {

  static valid(message: get_version_request): boolean {
    return Request.valid(message) && message['method'] === 'client.get_version' && message['params'].length === 0
  }

  static make(id: message_id): get_version_request {
    return {id: id, method: 'client.get_version', params: []}
  }

}

export type get_version_response = {
  id: message_id,
  result: string,
  err: error
}

export class GetVersionResponse extends Response {

    static valid(message): boolean {
      return Response.valid(message) && typeof message['result'] === 'string'
    }

    static result(message: get_version_response): string {
      if (GetVersionResponse.valid(message)) return message['result']

      throw "invalid get_version response"
    }

    static version(message: get_version_response): string {
      return GetVersionResponse.result(message)
    }

    static make(id: message_id, result: string, err?: error): get_version_response {
      if (err === undefined) {
        return {id: id, result: result, err:null}
      }

      return {id: id, result: result, err: err}
    }

}
