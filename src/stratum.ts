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

export function handleStratumRequest(handlers: StratumHandlers): (request: request) => Promise<response> {
  return async (request: request) => {

    var response: StratumResponse

    try {

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

    response['id'] = request.id
    return <response>response
  }
}

export function handleStratumMessage(handleRequest: (request: request) => Promise<response>): (data: Buffer, socket: net.Socket) => void {
  return async (data: Buffer, socket: net.Socket) => {
    log.info('socket.message.data', {data: data.toString() })

    var request: request = <request>JSON.parse(data.toString())
    if (!Request.valid(request)) {
      log.info('invalid message.')
      socket.end()
    }

    socket.write(`${JSON.stringify(handleRequest(request))}\n`)
  }
}
