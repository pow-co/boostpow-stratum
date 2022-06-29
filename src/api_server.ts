
import { log } from './log'

import { listSessions, Sessions } from './session'

import * as Joi from 'joi'

import * as Hapi from '@hapi/hapi'

import { badRequest } from 'boom'

import { plugin as socketio } from './socket.io/plugin'

const Inert = require('@hapi/inert');

const Vision = require('@hapi/vision');

const HapiSwagger = require('hapi-swagger');

const Pack = require('../package');

var server

import { register as prometheus } from './metrics'

async function initServer(): Hapi.Server {

  server = new Hapi.Server({
    host: process.env.HOST || "localhost",
    port: process.env.PORT || 5300,
    routes: {
      cors: true,
      validate: {
        options: {
          stripUnknown: true
        }
      }
    }
  });

  await server.register(socketio)

  const swaggerOptions = {
    info: {
      title: 'Boost Stratum Server API Docs',
      version: Pack.version,
      description: 'Developer API Documentation \n\n *** DEVELOPERS *** \n\n Edit this file under `swaggerOptions` in `src/server.ts` to better describe your service.'
    },
    schemes: ['https'],
    host: 'stratum.pow.co',
    documentationPath: '/',
    grouping: 'tags'
  }

  await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: swaggerOptions
      }
  ]);

  server.route({
    method: 'GET',
    path: '/metrics',
    handler: async (req, h) => {
      return h.response(await prometheus.metrics())
    }
  })

  server.route({

    method: "GET",

    path: "/api/v1/events",

    options: {

      tags: ['api', 'logs'],

      validate: {

        query: Joi.object({

          limit: Joi.number().optional(),

          offset: Joi.number().optional(),

          order: Joi.string().optional(),

          type: Joi.string().optional()

        })
      },

      response: {

        schema: Joi.object({

          events: Joi.array().items(Joi.object({

            id: Joi.number().required(),

            payload: Joi.object().required(),

            type: Joi.string().required(),

            createdAt: Joi.date().required(),

            updatedAt: Joi.date().required(),

          }))

        }),

        failAction: 'log'

      }

    },

    handler: async (request: Hapi.Request, h) => {

      const { remoteAddress, remotePort, query } = request

      await log.info('request.log.read', { remoteAddress, remotePort, query })

      try {

        let events = await log.read(request.query)

        return h.response({

          events

        })

      } catch(error) {

        log.error('request.events.list.error', error)

        return badRequest(error)

      }

    }
  });

  server.route({

    method: "GET",

    path: "/api/v1/sessions",

    options: { 

      tags: ['api', 'sessions'],

      response: {

        schema: Joi.object({

          sessions: Joi.array().items(Joi.object({

            connectedAt: Joi.date().required(),

            remoteIp: Joi.string().required(),

            remotePort: Joi.number().required(),

            sessionId: Joi.string().required()

          }))

        }),

        failAction: 'log'

      }

    },

    handler: async (request: Hapi.Request, h) => {

      const { remoteAddress, remotePort } = request

      log.info('request.sessions.list', {

        remoteAddress, remotePort

      })

      try {

        let sessions: Sessions = await listSessions();

        return {

          sessions: Object.values(sessions).map(session => session.toJSON())

        }

      } catch(error) {

        log.error('request.sessions.list.error', error)

        return badRequest(error)

      }

    }
  });

  return server

}

export { initServer } 

export { server }

if (require.main === module) {

  (async () => {

    let server = await initServer()

    server.start();

    log.info('api.server.started', server.info);

  })()

}

