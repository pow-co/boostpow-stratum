
import { Socket } from 'net'

import { log } from './log'

// Stratum protocol documentation: 
// https://docs.google.com/document/d/1ocEC8OdFYrvglyXbag1yi8WoskaZoYuR5HGhwf0hWAY/edit

export async function handleStratumMessage(data: Buffer, socket: Socket) {

  log.info('socket.message.data', {data: data.toString() })

  try {

    /* TODO: Daniel (please fill in your Stratum Protocol expertise here)
    *
    * - Parse the data buffer into a valid stratum message
    * - Detect and log the correct stratum protocol message
    * - Dispatch action to appropriate handler functions
    * - Send possible response to the socket
    */

  } catch(error) {

    log.info('stratum.message.error', error)

  }

}
