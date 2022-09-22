/* implements rabbi actor protocol */

require('dotenv').config();

import { Actor, Joi, log } from 'rabbi';

export async function start() {

  Actor.create({

    exchange: 'powco',

    routingkey: 'boost.job.created',

    queue: 'boost_job_created_to_stratum',

  })
  .start(async (channel, msg, json) => {

    log.info(msg.content.toString());

    log.info(json);

    channel.ack(msg);

  });

  Actor.create({

    exchange: 'powco',

    routingkey: 'boost.job.completed',

    queue: 'boost_job_completed_to_stratum'

  })
  .start(async (channel, msg, json) => {

    log.info(msg.content.toString());

    log.info(json);

    channel.ack(msg);

  });

}

if (require.main === module) {

  start();

}

