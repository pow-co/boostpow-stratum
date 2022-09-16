
import * as bsv from 'bsv'
import * as boostpow from 'boostpow'
import { Proof } from './Stratum/proof'
import { now_seconds } from './time'
import { JobManager, BoostJob, HashpowerEstimate, Worker, StratumAssignment } from './jobs'

export function test_job_manager(): JobManager {

  console.log("about to start job manager")
  let target = .01
  let content = new boostpow.Digest32(Buffer.from('12131415161718190ff0f0f00fff000f0f00f000f0000fff1213141516171819', 'hex'))
  let category = new boostpow.Int32Little(Buffer.from('12345678', 'hex'))
  let topic = new boostpow.Bytes(Buffer.from('0f0e0d0c0b0a0908070605040201000000000000', 'hex'))
  let data = new boostpow.Bytes(Buffer.from('0123456789', 'hex'))
  let user_nonce = new boostpow.UInt32Little(Buffer.from('fedcba98', 'hex'))
  let digest = boostpow.Digest32.fromHex('123423453456456756786789789a89ab9abcabcdbcdecdefdef0ef01f0120123')

  console.log("about to create job")

  // TODO make the test job
  let job: BoostJob = new BoostJob(0, new boostpow.Puzzle(new boostpow.Output(boostpow.Job.fromObject(
        {
          content: content.hex,
          diff: target,
          category: category.hex,
          tag: topic.hex,
          additionalData: data.hex,
          userNonce: user_nonce.hex
        }),
      7777,
      digest,
      0),
    'KwKYRBpVWEYdQeA4uRGAu959BN4M1WpaTuetwsoBYES8CrVkxfLt'))

  console.log("job created")

  // select a job for a worker.
  let select: (boolean, HashpowerEstimate, number) => BoostJob | undefined =
    (version_rolling: boolean,
      // we ignore hashpower and minimum difficulty for now.
      h: HashpowerEstimate,
      minimum_difficulty: number) => {
      console.log("about to send job to miner")
      return job
  }

  let assign: (Worker) => BoostJob | undefined = (w: Worker) => {
    return select(w.version_rolling, w.hashpower(), w.minimum_difficulty())
  }

  let complete = async (j: BoostJob, x: boostpow.work.Solution): Promise<boolean> => {
    return true
  }

  return {
    add: (o: boostpow.Output) => {},

    invalidate: (txid:string, vout:number) => {},

    subscribe: (w: Worker) => {
      let job = select(w.version_rolling, w.hashpower(), w.minimum_difficulty())
      if (!job) return
      return {
        // the initial job to assign to the worker.
        initial: job.stratumJob(now_seconds()),

        solved: (x: Proof): StratumAssignment | boolean => {
          console.log("checking proof");
          console.log("work string: ", x.string.toString())
          console.log("hash: ", x.string.hash.string)
          if (!x.valid()) return true

          complete(job, x.proof.Solution)

          return false
        }
      }
    }
  }
}
