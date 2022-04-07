require('dotenv').config()

import * as chai from 'chai'

const expect = chai.expect

const spies = require('chai-spies');

chai.use(spies);

var spy = chai.spy.sandbox()

export { spy }

export { expect, chai }

import { initServer } from '../src/api_server'

var request;

before(async () => {

  const server = await initServer()

  request = require('supertest')(server.listener)

})

export { request }

