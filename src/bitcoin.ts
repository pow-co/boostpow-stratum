import * as bsv from "bsv";
import * as boostpow from "boostpow";

export function pubKeyToAddress(pubKey: bsv.PubKey): boostpow.Digest20 {
  return new boostpow.Digest20(bsv.Hash.sha256Ripemd160(pubKey.toBuffer()));
}

export function privKeyToAddress(p: bsv.PrivKey): boostpow.Digest20 {
  return pubKeyToAddress(bsv.PubKey.fromPrivKey(p));
}

export function hdToAddress(hd: bsv.Bip32.Mainnet): boostpow.Digest20 {
  return pubKeyToAddress(hd.pubKey);
}

export interface Network {
  satsPerByte: () => Promise<number>;
  broadcast: (tx: bsv.Transaction) => Promise<boolean>;
}

export function nonfunctional_network(): Network {
  return {
    satsPerByte: async () => {
      return 0.5;
    },
    broadcast: async (tx: bsv.Transaction) => {
      return false;
    },
  };
}

export interface Keys {
  nextReceive: () => boostpow.Digest20;
  nextChange: () => boostpow.Digest20;
  nextBoost: () => bsv.PrivKey;
}

// a really basic wallet that only uses one key.
export function private_key_wallet(p: bsv.PrivKey): Keys {
  return {
    nextReceive: () => {
      return privKeyToAddress(p);
    },
    nextChange: () => {
      return privKeyToAddress(p);
    },
    nextBoost: () => {
      return p;
    },
  };
}

export function hd_wallet(master: bsv.Bip32.Mainnet, pathBIP44: string): Keys {
  function receive(i: number): bsv.Bip32.Mainnet {
    throw "incomplete method";
  }

  function change(i: number): bsv.Bip32.Mainnet {
    throw "incomplete method";
  }

  function boost(i: number): bsv.Bip32.Mainnet {
    throw "incomplete method";
  }

  let receiveIndex: number = 0;
  let changeIndex: number = 0;
  let boostIndex: number = 0;

  return {
    nextReceive: () => {
      let i: number = this.receiveIndex;
      this.receiveIndex++;
      return hdToAddress(this.receive(i));
    },
    nextChange: () => {
      let i: number = this.changeIndex;
      this.changeIndex++;
      return hdToAddress(this.receive(i));
    },
    nextBoost: () => {
      let i: number = this.boostIndex;
      this.boostIndex++;
      return hdToAddress(this.receive(i));
    },
  };
}
