
import { request, expect } from './utils'

import { log } from '../src/log'

describe('API Server', () => {

  describe('Reading Logs', () => {

    it('GET /api/v1/events should return a list of events', async () => {

      var response = await request.get('/api/v1/events?limit=10&order=desc&offset=0')

      expect(response.status).to.be.equal(200)

      expect(response.body.events).to.be.a('array')

      await log.info('proof.received')

      var response = await request.get('/api/v1/events?limit=3&order=desc')

      expect(response.body.events[1].type).to.be.equal('proof.received')

      await log.info('job.sent')

      var response = await request.get('/api/v1/events?limit=3&order=desc')

      expect(response.body.events[0].type).to.be.equal('request.log.read')

      expect(response.body.events[1].type).to.be.equal('job.sent')

      var response = await request.get('/api/v1/events?type=job.sent')

      expect(response.body.events[0].type).to.be.equal('job.sent')

      var response = await request.get('/api/v1/events?type=proof.received')

      expect(response.body.events[0].type).to.be.equal('proof.received')

      var response = await request.get('/api/v1/events?type=invalid')

      expect(response.body.events.length).to.be.equal(0)

    })

  })

  describe('Managing Client Sessions', () => {

    it('GET /api/v1/sessions should return a list of clients', async () => {

      const response = await request.get('/api/v1/sessions')

      expect(response.status).to.be.equal(200)

      expect(response.body.sessions).to.be.a('array')

    })

    it.skip('should increment the number of sessions when a new session is created')

  })

})
