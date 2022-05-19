import { message_id } from '../messageID'
import { method } from '../method'
import { request } from '../request'
import { error } from '../error'

export type StratumRequest = request

export interface StratumResponse {
  id?: message_id;
  result: JSONValue;
  err: error;
}

export interface StratumHandler  {
  (request: StratumRequest): Promise<StratumResponse>;
}

export interface StratumHandlers  {
  [key: string]: StratumHandler;
}
