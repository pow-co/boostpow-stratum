
import { expect } from './utils'

import { BoostPowJob } from 'boostpow'

import { listJobs } from '../src/powco'

describe("Calling PowCo Platform APIs", () => {

  it("should get a list of recent jobs", async () => {

    let jobs: typeof BoostPowJob[] = await listJobs()

    expect(jobs.length).to.be.greaterThan(0)

  })

})

