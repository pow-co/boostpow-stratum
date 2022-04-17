import * as net from 'net'

import { log } from './log'

import { join } from 'path'

import * as Joi from 'joi'

// Stratum protocol documentation:
// https://docs.google.com/document/d/1ocEC8OdFYrvglyXbag1yi8WoskaZoYuR5HGhwf0hWAY/edit

import { error, Error } from './Stratum/error'
import { request, Request } from './Stratum/request'
import { response, Response } from './Stratum/response'

import { StratumRequest, StratumResponse, StratumHandler, StratumHandlers } from './Stratum/handlers/base'

export const handlers: StratumHandlers = require('require-all')({
  dirname: join(__dirname, 'Stratum/handlers'),
  filter:  /(mining.+)\.ts$/,
  resolve: (handler) => {
    return handler.default
  }
})

export function handleStratumMessage(handlers: StratumHandlers): (data: Buffer, socket: net.Socket) => void {
  return async (data: Buffer, socket: net.Socket) => {
    log.info('socket.message.data', {data: data.toString() })

    var response: StratumResponse

    var request: request

    try {

      request = <request>JSON.parse(data.toString())
      if (!Request.valid(request)) {
        throw "invalid message encountered: " + data.toString()
      }

      let handler: StratumHandler = handlers[request.method]

      if (handler) {

        log.info(`stratum.request.${request.method}`, request.params)

        response = await handler(request)

        log.info(`stratum.response.${request.method}`, response)

      } else {

        response = {
          err: Error.make(Error.ILLEGAL_METHOD),
          result: null
        }

      }

    } catch(error) {

      response = { err: Error.make(Error.UNKNOWN), result: null }

      log.error('stratum.message.error', error)
      log.info('stratum.message.error', error)

    }

    Object.assign({id: request.id, err: null}, response)

    socket.write(`${JSON.stringify(response)}\n`)
  }
}
