import {SessionID} from './sessionID'
import {extranonce, Extranonce} from './mining/set_extranonce'
import {notify_params, NotifyParams} from './mining/notify'
import {share, Share} from './mining/submit'
import * as boostpow from 'boostpow'

export function work_puzzle(
  en: extranonce,
  n: notify_params,
  version_mask?: string): boostpow.work.Puzzle | undefined {

  if (!Extranonce.valid(en) || !NotifyParams.valid(n) ||
    (!!version_mask && !SessionID.valid(version_mask))) return

  if (version_mask) {
    return new boostpow.work.Puzzle(
      NotifyParams.version(n),
      NotifyParams.prevHash(n),
      NotifyParams.nbits(n),
      NotifyParams.generationTX1(n),
      NotifyParams.generationTX2(n),
      boostpow.Int32Little.fromHex(version_mask)
    )
  } else {
    return new boostpow.work.Puzzle(
      NotifyParams.version(n),
      NotifyParams.prevHash(n),
      NotifyParams.nbits(n),
      NotifyParams.generationTX1(n),
      NotifyParams.generationTX2(n)
    )
  }
}

// construct a work proof from
//   * an extra nonce, provided in the subscribe response
//   * notify params
//   * share returned
//   * an optional version mask (provided first, with the configure response
export function prove(
  en: extranonce,
  n: notify_params,
  x: share,
  version_mask?: string): boostpow.work.Proof | undefined {

  const valid_share=Share.valid(x);
  const right_params=NotifyParams.jobID(n) != Share.jobID(x);
  const nonce_length=en[1] != Share.extranonce2(x).length;
  const ver_mask_1= (version_mask === undefined && x[5] !== undefined);
  const ver_mask_2=(version_mask !== undefined && x[5] === undefined);
  if (!valid_share ||
     right_params ||
    nonce_length ||
    ver_mask_1 ||
      ver_mask_2)
     return

  let p: boostpow.work.Puzzle = work_puzzle(en, n, version_mask)
  if (!p) return

  let u: boostpow.work.Solution
  if (x[5]) {
    u = new boostpow.work.Solution(
      Share.time(x),
      Extranonce.extranonce1(en),
      Share.extranonce2(x),
      Share.nonce(x),
      Share.generalPurposeBits(x)
    )
  } else {
    u = new boostpow.work.Solution(
      Share.time(x),
      Extranonce.extranonce1(en),
      Share.extranonce2(x),
      Share.nonce(x)
    )
  }

  // the proof that is returned may not be valid at this point but
  // we may need to check it against a different difficulty than
  // the one given in the proof.
  return new boostpow.work.Proof(p, u)
}

export class Proof {
  jobID: string
  proof: boostpow.work.Proof
  string: boostpow.work.PowString
  hash: boostpow.Digest32
  constructor (
    en: extranonce,
    n: notify_params,
    x: share,
    mask?: string) {
    this.jobID = n[0]
    this.proof = prove(en, n, x, mask)
    if (this.proof) {
      this.string = this.proof.string()
      this.hash = this.string.hash
    }
  }

  valid(d?: boostpow.Difficulty): boolean {
    if (!this.hash) return false
    let target: boostpow.bsv.crypto.BN
    if (!!d) target = d.target
    else target = this.proof.Puzzle.Difficulty.target
    return (new boostpow.bsv.crypto.BN(this.hash.hex, 'hex')).cmp(target) < 0
  }

  get metadata(): boostpow.Bytes {
    return this.proof.metadata()
  }
}
