
import { StratumRequest, StratumResponse } from './base'

export default async function(json: StratumRequest): Promise<StratumResponse> {

  return {
    result: true
  }

}

