
import { expect, spy } from './utils'

import { models } from '../src/models'

import * as uuid from 'uuid'

import { log } from '../src/log'

import * as through from 'through2'

describe('Log', () => {

  describe('persisting events', () => {

    it('should persit logs to the database', async () => {

      const session_id = '3349334324234'

      let record = await log.info('client.authorized', {
        ip: '127.0.0.1',
        session_id
      })

      expect(record.id).to.be.greaterThan(0)

      expect(record.type).to.be.equal('client.authorized')

      expect(record.payload.session_id).to.be.equal(session_id)

      expect(record.createdAt).to.be.a('date')

      expect(record.error).to.be.equal(false)

    })

    it('should log synchronously as well and not wait', async () => {

      spy.on(models.Event, ['create'])

      log.info('my.event', { good: { better: 'best' } })

      expect(models.Event.create).to.have.been.called()

    })

  })

  describe('Reading the log', () => {

    it('should get the last message logged', async () => {

      const uid = uuid.v4()

      let record = await log.info('share.submitted', { uid })

      console.log(record.toJSON())

      let events = await log.read({

        type: 'share.submitted',

        limit: 1

      })

      for (let event of events) { console.log(event.toJSON()) }

      const [event] = events

      expect(event.payload.uid).to.be.equal(uid)

      expect(event.type).to.be.equal('share.submitted')

    })

  })

})

