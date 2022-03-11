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
    return Request.valid(message) && message['method'] === "client.get_version" && message['params'].length === 0
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

}
