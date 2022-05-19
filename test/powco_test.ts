
import { expect } from './utils'

import { BoostOutput } from '../src/jobs'

import { listJobs } from '../src/powco'

describe("Calling PowCo Platform APIs", () => {

  it("should get a list of recent jobs", async () => {

    let jobs: BoostOutput[] = await listJobs()

    expect(jobs.length).to.be.greaterThan(0)

  })

})
