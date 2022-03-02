
import * as chai from 'chai'

import { Server } from '../src/server'

const server = new Server()

export { server }

const expect = chai.expect

const spies = require('chai-spies');

chai.use(spies);

var spy = chai.spy.sandbox()

export { spy }

export { expect, chai }

