// Message id is a unique identifier of queries to match them up with responses
// that come later and may be out of order. It is either an integer or string.
export type message_id = number | string

export class MessageID {

  static valid(id: message_id): boolean {
    return typeof id === 'string' || Number.isInteger(id)
  }

}
