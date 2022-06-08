import * as net from 'net'

import { log } from './log'

import { join } from 'path'

import * as Joi from 'joi'

// Stratum protocol documentation:
// https://docs.google.com/document/d/1ocEC8OdFYrvglyXbag1yi8WoskaZoYuR5HGhwf0hWAY/edit

import { session_id } from './Stratum/sessionID'
import { method } from './Stratum/method'
import { parameters, result } from './Stratum/message'
import { error, Error } from './Stratum/error'
import { request, Request } from './Stratum/request'
import { response, Response } from './Stratum/response'
import { notification, Notification } from './Stratum/notification'

import { StratumRequest, StratumResponse, StratumHandler, StratumHandlers } from './Stratum/handlers/base'

import { JSONValue } from './json'
import { Connection, Receive, Protocol } from './session'

// Remote represents a connection to a remote Stratum implementation. Could
// be server or client.
export interface Remote {
  'request': (m: method, p: parameters, callback: (r: result) => void) => void,
  'notify': (n: notification) => void,
  'respond': (r: response) => void,
}

// remote_peer takes a way to send json messages and turns that into a Remote
// as well as a function for receiving response messages from this remote client
// that reply to request messages that have been sent to it.
function remote_peer(conn: Connection):
  {remote: Remote, receive: (r: response) => void} {
  let counter = 0

  let ids: {[key: session_id]: (r: result) => void} = {}

  return {
    'remote' : {
      'request': (m: method, p: parameters, callback: (r: result) => void) => {
        ids[counter] = callback
        conn.send({id: counter, method: m, params: p})
        counter++
      },
      'notify': (n: notification) => {
        conn.send(n)
      },
      'respond': (r: response) => {
        conn.send(<JSONValue><unknown>r)
      },
    },
    'receive': (r: response) => {
      let back = ids[r.id]
      if (!back) conn.close()
      back(r.result)
    }
  }
}

// Local represents a local stratum implementation which could also be a
// client or server, depending on the implementation. It takes a Remote and
// provides functions for handling notifications and requests from the
// remote client.
export type Local = (r: Remote, close: () => void) => {
  'notify': (notification) => void,
  'request': (request) => void,
}

// stratum takes a Local implementation and provides a Protocl, which means
// that it takes a Connection and finally completes the circuite between client
// and server.
export function stratum(local: Local): Protocol {
  return (conn: Connection) => {
    let remote = remote_peer(conn)
    let self = local(remote.remote, conn.close)
    return async (msg: JSONValue) => {
      try {
        let request = Request.read(msg)
        if (request) {
          self.request(request)
          return
        }

        let notification = Notification.read(msg)
        if (notification) {
          self.notify(notification)
          return
        }

        let response = Response.read(msg)
        if (response) {
          remote.receive(response)
          return
        }

        log.info('invalid message.')
        conn.close()
      } catch (error) {
        log.error('stratum.message.error: name = ' + error.name + "; message = " + error.msg)
        log.info('stratum.message.error: name = ' + error.name + "; message = " + error.msg)
      }
    }
  }
}
