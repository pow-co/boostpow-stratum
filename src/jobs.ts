import * as bsv from 'bsv'
import { broadcast, privKeyToAddress, wallet } from './bitcoin'
import { notify_params, NotifyParams } from './Stratum/mining/notify'
import { share } from './Stratum/mining/submit'
import { now_seconds } from './time'
import { Proof } from './Stratum/proof'
import * as boostpow from 'boostpow'

// this is how we index jobs internally.
function boost_output_index(out: boostpow.Output): string {
  return out.txid.hex + ":" + out.vout.toString()
}

export interface StratumAssignment {
  notify: notify_params,
  extranonce2Size: number
}

// a boost output + a private key = a job that we can start working on.
class BoostJob {
  constructor(
    public jobID: number,
    public puzzle: boostpow.Puzzle,
  ) {}

  stratumJob(now: boostpow.UInt32Little): StratumAssignment {
    let p: boostpow.work.Puzzle = this.puzzle.workPuzzle

    return {
      notify: NotifyParams.make(
      this.jobID.toString(), p.Content, p.MetaBegin, p.MetaEnd,
      [], p.Category, p.Difficulty, now, true),
      extranonce2Size: this.puzzle.output.script.scriptVersion === 1 ? 8 : 32
    }
  }

  estimated_locking_script_size(): number {
    throw "incomplete method"
  }

  // create a transaction that sends all coins in a boost output to our address.
  complete(solution: boostpow.work.Solution,
    our_address: bsv.Address,
    satsPerByte: number): bsv.Transaction {
    throw "incomplete method"

    // TODO
    let incomplete_tx_length = 0
    let estimated_size = incomplete_tx_length + this.estimated_locking_script_size()

    let output_value = this.puzzle.output.value - Math.ceil(estimated_size * satsPerByte)

    // TODO
    let incomplete_tx: Buffer

    let redeem_script = this.puzzle.redeem(solution, incomplete_tx, 0)

    // TODO put the redeem script into the tx
    return new bsv.Transaction(incomplete_tx)
  }
}

export interface HashpowerEstimate {hashpower: number, certainty: number}

// someone working on a job via stratum.
export interface Worker {
  subscribe_extranonce: boolean,
  new_job: (job: StratumAssignment) => void,
  hashpower: () => HashpowerEstimate,
  minimum_difficulty: () => number,
  cancel: () => void
}

export interface JobManager {
  add: (o: boostpow.Output) => void,
  invalidate: (string, number) => void,
  subscribe: (w: Worker) => undefined | {initial: StratumAssignment, solved: (p: Proof) => void }
}

// this has been implemented as a function rather than a class in order to avoid
// the use of 'this'. There is a problem with passing on a member function of a
// class and calling it in some other function if it uses 'this'.
// this problem can be fixed by using bind properly but I like this way better.
export function job_manager(initial_jobs: boostpow.Output[], wallet: wallet, maxDifficulty: number): JobManager {

  // this will contain all boost jobs that we are keeping track of.
  let jobs: {[key: string]: BoostJob} = {}

  // the workers who are working on the jobs.
  let workers: {[key: number]: Worker} = {}

  let nextJobID: number = 0

  let add: (o: boostpow.Output) => void = (o: boostpow.Output) => {
    // for now we only do bounty jobs. We need these properties to be defined
    // or we can't tell if he boost is worth doing.
    if (o.script.isContract()) return

    jobs[boost_output_index(o)] = new BoostJob(nextJobID, new boostpow.Puzzle(o, wallet.nextBoost()))
    nextJobID++
  }

  for (let job of initial_jobs) {
    add(job)
  }

  // select a job for a worker.
  let select: (boolean, HashpowerEstimate, number) => BoostJob | undefined =
    (subscribe_extranonce: boolean,
      // we ignore hashpower and minimum difficulty for now.
      h: HashpowerEstimate,
      minimum_difficulty: number) => {
    for (let index of Object.keys(jobs)) {
      let j = jobs[index]

      let difficulty = j.puzzle.output.script.difficulty
      if (difficulty > maxDifficulty) continue

      // we can't do boost version 2 with the non extended Stratum protocol.j.output.script.scriptVersion
      if (!subscribe_extranonce && j.puzzle.output.script.scriptVersion > 1) continue

      // script version 1 can't do very high difficulties.
      if (j.puzzle.output.script.scriptVersion == 1 && difficulty > 4000000000) continue

      if (workers[j.jobID]) continue

      return j
    }

    return undefined
  }

  let assign: (Worker) => BoostJob | undefined = (w: Worker) => {
    let job = select(w.subscribe_extranonce, w.hashpower(), w.minimum_difficulty())
    if (!job) {
      w.cancel()
      return
    }

    workers[job.jobID] = w
    w.new_job(job.stratumJob(now_seconds()))
    return job
  }

  let complete = async (j: BoostJob, x: boostpow.work.Solution): Promise<void> => {
    // TODO get sats per byte from MAPI
    // for now we use this fixed rate.
    let satsPerByte = .5

    let tx = j.complete(x, wallet.nextReceive(), satsPerByte)
    if (!(await broadcast(tx)))
      throw "could not broadcast transaction";
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

    subscribe: (w: Worker) => {
      let job = select(w.subscribe_extranonce, w.hashpower(), w.minimum_difficulty())
      if (!job) return
      workers[job.jobID] = w
      return {
        // the initial job to assign to the worker.
        initial: job.stratumJob(now_seconds()),

        solved: (x: Proof): void => {
          // this should not happen. The function is supposed to be
          // called on a solved share.
          if (!x.valid()) throw "solved called on invalid job"

          complete(job, x.proof.Solution)

          // assign a new job to the worker.
          let new_job = assign(w)
          if (new_job) job = new_job


          // TODO estimate tx size
          let estimated_size = 0
        }
      }
    }
  }
}
