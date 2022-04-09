
import { Socket } from 'net'

import { log } from './log'

import { join } from 'path'

// Stratum protocol documentation: 
// https://docs.google.com/document/d/1ocEC8OdFYrvglyXbag1yi8WoskaZoYuR5HGhwf0hWAY/edit

import { StratumHandler, StratumHandlers, StratumResponse, StratumRequest } from './Stratum/handlers/base'

export const handlers: StratumHandlers = require('require-all')({
  dirname: join(__dirname, 'Stratum/handlers'),
  filter:  /(mining.+)\.ts$/,
  resolve: (handler) => {
    return handler.default
  }
})

import * as Joi from 'joi'

const schema = Joi.object({
  id: [Joi.string().required(), Joi.number().required()], // string or number
  method: Joi.string().required(),
  params: Joi.array().required()
})

export async function handleStratumMessage(data: Buffer, socket: Socket) {

  log.info('socket.message.data', {data: data.toString() })

  var response: StratumResponse;

  var request: StratumRequest;;

  try {

    request = JSON.parse(data.toString())

    await schema.validateAsync(request)

    if (request.method && handlers[request.method]) {

      log.info(`stratum.request.${request.method}`, request.params)

      let handler: StratumHandler = handlers[request.method]

      response = await handler(request)

      log.info(`stratum.response.${request.method}`, response)

    } else {

      response = {
        error: ["notfound", "stratum method not found"],
        result: null
      }

    }

    Object.assign({ id: request.id, error: null }, response)

  } catch(error) {

    response = { id: request?.id, error: [500, error.message], result: null }

    log.error('stratum.message.error', error)
    log.info('stratum.message.error', error)

  }

  socket.write(`${JSON.stringify(response)}\n`)

}
