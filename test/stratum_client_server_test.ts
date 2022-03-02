
import { expect, server, spy } from './utils'

import { Client } from '../src/client'

import { Event, listEvents, listEventsForClient } from '../src/event'

import { log } from '../src/log'

/* Stratum Client & Server In Typescript
 *
 *
 * Look at
 * https://github.com/hashrabbit/carrot-pool-stratum/blob/9d80e7862636d01971e7a034a81d608ce62ef9a4/scripts/stratum/index.js
 * for a clear example on how to implement a simple stratum server and client*/

describe("Client Connections", () => {

  it("should log the client connection details in database", async () => {

    let client: Client = new Client({ ip: '127.0.0.1' })

    let event: Event = await client.connect(client)

    expect(event.get('msg')).to.be.equal('client.connected')

    expect(event.get('ip')).to.be.equal('127.0.0.1')

    await client.disconnect(server)

  })

  it("should log stratum credentials to database when provided by client", async () => {

    let client: Client = new Client({ ip: '127.0.0.1' })

    let event: Event = await client.connect(server)

    expect(event.get('msg')).to.be.equal('client.connected')

    expect(event.get('ip').to.be.equal('127.0.0.1'))

  })

  it("should log other stratum metadata provided by the client", async () => {

  })

  it("should log the client disconnection in the event database", async () => {

    let client: Client = new Client({ ip: '127.0.0.1' })

    let event: Event = await client.connect(server)

    expect(event.get('msg')).to.be.equal('disconnected')

    expect(event.get('ip')).to.be.equal('127.0.0.1')

    await client.disconnect(server)

  })

  it("should log every single message sent from the client", async () => {

    const ip = '127.0.0.1'

    let client: Client = new Client({ ip })

    spy.on(log, ['info'])

    let event: Event = await client.connect(server)

    event = await client.sendTo(server, { type: 'some.stratum.event' })

    expect(event.get('msg')).to.be.equal('some.stratum.event')

    event = await client.sendTo(server, { type: 'another.stratum.event' })

    expect(event.get('msg')).to.be.equal('another.stratum.event')

    expect(log.info).to.have.been.called.with({ ip }, 'some.stratum.event')

    expect(log.info).to.have.been.called.with({ ip }, 'another.stratum.event')

  })

  it("should list logged events by event type", async () => {

    let client: Client = new Client({ ip: '127.0.0.1' })

    let records = await listEvents({ msg: 'some.stratum.event' })

    expect(records.length).to.be.greaterThan(0)

    expect(records[0].get('msg')).to.be.equal('some.stratum.event')

  })

  it("should list logged events for a given client", async () => {

    let client: Client = new Client({ ip: '127.0.0.1' })

    let records = await listEventsForClient(client, { msg: 'some.stratum.event' })

    expect(records.length).to.be.greaterThan(0)

    expect(records[0].get('msg')).to.be.equal('some.stratum.event')

  })

})

