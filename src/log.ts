
const Pino = require('pino')

import { models } from './models'

import { broadcast } from './socket.io/pubsub'

interface NewLogger {
  namespace: string;
}

interface LogQuery {
  type?: string;
  payload?: any;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  error?: boolean;
}

class Logger {

  namespace: string;

  pino: typeof Pino;

  constructor(params: NewLogger = {namespace: ''}) {

    this.pino = Pino()

    this.namespace = params.namespace

  }

  async info(event_type: string, payload: any = {}) {

    this.pino.info({...payload, namespace: this.namespace }, event_type)

    let record = await models.Event.create({
      namespace: this.namespace,
      type: event_type,
      payload
    })

    const message = Object.assign(record.payload, {
      msg: record.type,
      createdAt: record.createdAt,
    })

    if (record.error) { message.error = record.error }

    broadcast('log', message)

    return record;

  }

  async error(error_type: string, payload: any = {}) {

    this.pino.error({...payload, namespace: this.namespace }, error_type)

    let record = await models.Event.create({
      namespace: this.namespace,
      type: error_type,
      payload,
      error: true
    })

    return record;

  }

  async debug(...params) {

    this.pino.debug(params)

  }

  async read(query: LogQuery = {}) {

    this.pino.debug('log.read', query)

    const where = {
      namespace: this.namespace,
      error: query.error || false
    }

    if (query.type) { where['type'] = query.type }

    if (query.payload) { where['payload'] = query.payload }

    const findAll = {

      where,

      limit: query.limit || 100,

      offset: query.offset || 0,

      order: [['createdAt', query.order || 'asc']]

    }

    let records = await models.Event.findAll(findAll)

    return records;

  }

}

const log = new Logger({ namespace: 'stratum' })

export { log }

