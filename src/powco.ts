
import * as http from 'superagent'
import * as boostpow from 'boostpow'
import { BoostOutput } from './jobs'

interface PowcoJob {
  content: string;
  difficulty: number;
  category: string;
  tag: string;
  txid: string;
  value: number;
  timestamp: Date;
  vout: number;
  additionalData: string;
  script: string;
  spent: boolean;
}

export async function listJobs(): Promise<BoostOutput[]> {

  let response = await http.get('https://pow.co/api/v1/boost/jobs')

  let jobs: BoostOutput[] = []
  for (let j of response.body.jobs) {
    if (j.script === null) continue
    let o: BoostOutput
    try {
      o = new BoostOutput(boostpow.Job.fromHex(j.script),
        j.value, boostpow.Digest32.fromHex(j.txid), j.vout)
      jobs.push(o)
    } catch (x) {}
  }

  return jobs

}
