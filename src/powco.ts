
import * as http from 'superagent'

import { BoostPowJob } from 'boostpow'

export async function listJobs(): Promise<typeof BoostPowJob[]> {

  let response = await http.get('https://pow.co/api/v1/jobs')

  return response.body.jobs

}
