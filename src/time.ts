import * as boostpow from 'boostpow'

export let now_seconds = () => boostpow.UInt32Little.fromNumber(Math.floor(Date.now() / 1000))
