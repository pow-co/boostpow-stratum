
import * as chai from 'chai'

const expect = chai.expect

const spies = require('chai-spies');

chai.use(spies);

var spy = chai.spy.sandbox()

export { spy }

export { expect, chai }
