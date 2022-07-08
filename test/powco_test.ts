import { expect } from "./utils";
import { listJobs } from "../src/powco";
import * as boostpow from "boostpow";

describe("Calling PowCo Platform APIs", () => {
  it("should get a list of recent jobs", async () => {
    let jobs: boostpow.Output[] = await listJobs();

    expect(jobs.length).to.be.greaterThan(0);
  });
});
