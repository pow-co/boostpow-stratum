// Message id is either an integer or string, must be a unique identifier.
export type message_id = number | string

export class MessageID {

  static valid(id: message_id): boolean {
    return typeof id === 'string' || Number.isInteger(id)
  }

}
