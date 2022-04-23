
import * as http from 'superagent'
import * as boostpow from 'boostpow'

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

export async function listJobs(): Promise<boostpow.Output[]> {

  let response = await http.get('https://pow.co/api/v1/boost/jobs')

  let jobs: boostpow.Output[] = []
  for (let j of response.body.jobs) {
    if (j.script === null) continue
    let o: boostpow.Output
    try {
      o = new boostpow.Output(boostpow.Job.fromHex(j.script),
        j.value, boostpow.Digest32.fromHex(j.txid), j.vout)
      jobs.push(o)
    } catch (x) {}
  }

  return jobs

}
