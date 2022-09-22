
const Pino = require('pino')

import { models } from './models'

import { broadcast } from './socket.io/pubsub'

import * as winston from 'winston'

import config from './config'

const transports = [
  new winston.transports.Console({ level: 'debug' })
]

if (config.get('loki_host')) {

  const LokiTransport = require("winston-loki");

  const lokiConfig = {
    format: winston.format.json(),
    host: config.get('loki_host'),
    json: true,
    batching: false,
    labels: { app: config.get('loki_label_app') },
    level: 'info'
  }

  if (config.get('loki_basic_auth')) {

    lokiConfig['basicAuth'] = config.get('loki_basic_auth')
  }

  transports.push(
    new LokiTransport(lokiConfig)
  )

}

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

  log: winston.Logger;

  constructor(params: NewLogger = {namespace: ''}) {

    const transports = [
      new winston.transports.Console(),
    ]

    if (config.get('loki_host')) {

      const LokiTransport = require("winston-loki");
    
      const lokiConfig = {
        format: winston.format.json(),
        host: config.get('loki_host'),
        json: true,
        batching: false,
        labels: { app: config.get('loki_label_app') }
      }
    
      if (config.get('loki_basic_auth')) {
    
        lokiConfig['basicAuth'] = config.get('loki_basic_auth')
      }
    
      transports.push(
        new LokiTransport(lokiConfig)
      )
    
    }    
    
    this.log = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'boostpow' },
      transports
    });

    this.namespace = params.namespace

  }

  async info(event_type: string, payload: any = {}) {

    this.log.info(event_type, payload)

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

    this.log.error(error_type, payload)

    let record = await models.Event.create({
      namespace: this.namespace,
      type: error_type,
      payload,
      error: true
    })

    return record;

  }

  async debug(...params) {

    this.log.debug(params)

  }

  async read(query: LogQuery = {}) {

    this.log.debug('log.read', query)

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

