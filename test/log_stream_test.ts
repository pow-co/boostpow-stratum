
import { expect, spy } from './utils'

import { models } from '../src/models'

import * as uuid from 'uuid'

import { LogStream } from '../src/log_stream'
import { log } from '../src/log'

import * as through from 'through2'

describe('Log', () => {

  describe('Streaming the log', () => {

    it.skip('should stream logs from a given date', async () => {

      await log.info('share.submitted', { uid: 1 })
      await log.info('share.submitted', { uid: 2 })
      await log.info('share.submitted', { uid: 3 })
      await log.info('share.submitted', { uid: 4 })
      
      let stream = new LogStream({
        namespace: 'stratum',
        type: 'share.submitted'
      })

      var numEventsReceived = 0

      stream.pipe(through((event, enc, next) => {

        numEventsReceived++

        next()

      }))

      while (numEventsReceived < 4) { }

    })

  })

})

