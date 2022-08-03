import * as bsv from 'bsv'
import * as boostpow from 'boostpow'
import { broadcast } from 'powco'

export function pubKeyToPubKeyHash(pubKey: bsv.PubKey): boostpow.Digest20 {
  return new boostpow.Digest20(bsv.Hash.sha256Ripemd160(pubKey.toBuffer()))
}

export function privKeyToPubKeyHash(p: bsv.PrivKey): boostpow.Digest20 {
  return pubKeyToPubKeyHash(bsv.PubKey.fromPrivKey(p))
}

export function hdToPubKeyHash(hd: bsv.Bip32.Mainnet): boostpow.Digest20 {
  return pubKeyToPubKeyHash(hd.pubKey)
}

export interface Network {
  satsPerByte: () => Promise<number>,
  broadcast: (tx: Buffer) => Promise<boolean>
}

export function nonfunctional_network(): Network {
  return {
    satsPerByte: async () => {
      return .5
    },
    broadcast: async (tx: Buffer) => {
      return false;
    }
  }
}

export function powco_network(): Network {
  return {
    satsPerByte: async () => {
      return .5
    },
    broadcast: async (tx: Buffer) => {
      await broadcast(tx.toString('hex'));
      return true
    }
  }
}

export interface Keys {
  nextReceive: () => string,
  nextChange: () => string,
  nextBoost: () => bsv.PrivKey
}

// a really basic wallet that only uses one key.
export function private_key_wallet(p: bsv.PrivKey): Keys {
  let addr: string = bsv.Address.fromPrivKey(p).toString()
  return {
    nextReceive: () => {
      return addr
    },
    nextChange: () => {
      return addr
    },
    nextBoost: () => {
      return p
    }
  }
}
