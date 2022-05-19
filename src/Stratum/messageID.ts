import * as Joi from 'joi'

// Message id is a unique identifier of queries to match them up with responses
// that come later and may be out of order. It is either an integer or string.

export type message_id = number | string

export class MessageID {
  public static schema = Joi.alternatives().try(Joi.string(), Joi.number().integer()).required()

  static valid(id: message_id): boolean {
    return (!MessageID.schema.validate(id).error)
  }
}
