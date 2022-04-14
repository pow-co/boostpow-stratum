
import { StratumRequest, StratumResponse } from './base'

export default async function(json: StratumRequest): Promise<StratumResponse> {

  // example taken from google drive documentation
  let result = [["mining.notify", "ae6812eb4cd7735a302a8a9dd95cf71f"], "08000002", 4]

  return {
    result
  }

}

