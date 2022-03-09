
import { log } from './log'

import { listSessions } from './session'

import * as Joi from 'joi'

import * as Hapi from '@hapi/hapi'

import { badRequest } from 'boom'


const server = new Hapi.Server({
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8000,
  routes: {
    cors: true,
    validate: {
      options: {
        stripUnknown: true
      }
    }
  }
});

server.route({

  method: "GET",

  path: "/api/v1/events",

  options: {

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

    response: {

      schema: Joi.object({

        sessions: Joi.array().items(Joi.object({

          connectedAt: Joi.date().required(),

          remoteIp: Joi.string().required(),

          remotePort: Joi.number().required(),

          uid: Joi.string().required()

        }))

      }),

      failAction: 'log'

    }

  },

  handler: async (request: Hapi.Request, h) => {

    try {

      let sessions = await listSessions();

      return {

        sessions

      }

    } catch(error) {

      log.error('request.sessions.list.error', error)

      return badRequest(error)

    }

  }
});

export { server } 

if (require.main === module) {

  (async () => {

    server.start();

    log.info('api.server.started', server.info);

  })()

}

