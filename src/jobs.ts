import * as bsv from 'bsv'
import { privKeyToAddress, wallet } from './bitcoin'
import { notify_params, NotifyParams } from './Stratum/mining/notify'
import * as boostpow from 'boostpow'

export class BoostOutput {
  script: boostpow.Job
  value: number
  txid: boostpow.Digest32
  vout: number

  constructor(job: boostpow.Job, value: number, txid: boostpow.Digest32, vout: number) {
    this.script = job
    this.value = value
    this.txid = txid
    this.vout = vout
  }

  index(): string {
    return this.txid.hex + ":" + this.vout.toString()
  }
}

export interface StratumJob {
  'notify': notify_params,
  'extranonce2Size': number
}

let now = () => boostpow.UInt32Little.fromNumber(Math.floor(Date.now() / 1000))

class BoostJob {
  constructor(
    public jobID: number,
    public output: BoostOutput,
    public key: bsv.PrivKey
  ) {}

  stratumJob(now: boostpow.UInt32Little): StratumJob {
    let puzzle: boostpow.work.Puzzle = boostpow.Job.puzzle(this.output.script, privKeyToAddress(this.key))

    return {
      notify: NotifyParams.make(
      this.jobID.toString(), puzzle.Content, puzzle.MetaBegin, puzzle.MetaEnd,
      [], puzzle.Category, puzzle.Difficulty, now, true),
      extranonce2Size: this.output.script.scriptVersion === 1 ? 8 : 32
    }
  }
}

export interface Worker {
  subscribe_extranonce: boolean,
  new_job: (job: StratumJob) => void,
  hashpower: () => {'hashpower': number, 'certainty': number},
  minimum_difficulty: () => number,
  cancel: () => void
}

export interface JobManager {
  add: (BoostOutput) => void,
  invalidate: (string, number) => void,
  subscribe: (Worker) => StratumJob | undefined
}

// this has been implemented as a function rather than a class in order to avoid
// the use of 'this'. There is a problem with passing on a member function of a
// class and calling it in some other function if it uses 'this'.
export function job_manager(initial_jobs: BoostOutput[], wallet: wallet, maxDifficulty: number): JobManager {

  // this will contain all boost jobs that we are keeping track of.
  let jobs: {[key: string]: BoostJob} = {}

  // the workers who are working on the jobs.
  let workers: {[key: number]: Worker} = {}

  // this should be a real wallet some day.
  wallet: bsv.PrivKey

  let nextJobID: number = 0

  function add(o: BoostOutput) {
    // for now we only do bounty jobs. We need these properties to be defined
    // or we can't tell if he boost is worth doing.
    if (o.script.isContract()) return

    jobs[o.index()] = new BoostJob(nextJobID, o, wallet)
    nextJobID++
  }

  for (let job of initial_jobs) {
    add(job)
  }

  function select(subscribe_extranonce: boolean,
    // we ignore hashpower and minimum difficulty for now.
    h: {hashpower: number, certainty: number},
    minimum_difficulty: number): BoostJob | undefined {
    for (let index of Object.keys(jobs)) {
      let j = jobs[index]

      let difficulty = j.output.script.difficulty
      if (difficulty > maxDifficulty) continue

      // we can't do boost version 2 with the non extended Stratum protocol.j.output.script.scriptVersion
      if (!subscribe_extranonce && j.output.script.scriptVersion > 1) continue

      // script version 1 can't do very high difficulties.
      if (j.output.script.scriptVersion == 1 && difficulty > 4000000000) continue

      if (workers[j.jobID]) continue

      return j
    }

    return undefined
  }

  function assign(w: Worker) {
    let job = select(w.subscribe_extranonce, w.hashpower(), w.minimum_difficulty())
    if (!job) w.cancel()
    workers[job.jobID] = w
    w.new_job(job.stratumJob(now()))
  }

  return {
    add: add,

    invalidate: (txid:string, vout:number) => {
      let index: string = txid + ':' + vout.toString()
      let job = jobs.index
      if (job) {
        delete jobs.index
        let worker = workers[job.jobID]
        if (worker) {
          delete workers[job.jobID]
          assign(worker)
        }
      }
    },

    subscribe: (w: Worker): StratumJob | undefined => {
      let job = select(w.subscribe_extranonce, w.hashpower(), w.minimum_difficulty())
      if (!job) return
      workers[job.jobID] = w
      return job.stratumJob(now())
    }
  }
}
