import {BoostJob} from "../src/jobs";
import * as boostpow from 'boostpow'
import * as bsv from 'bsv'

describe('Jobs', () => {

    it('Redeem script', () => {
        const categoryHex = "d2040000"

        const contentHex = boostpow.BoostUtilsHelper.stringToBuffer(
            "hello animal", 32).reverse().toString("hex")

        const difficulty = 0.0001

        const tagHex = new Buffer("this is a tag", "ascii").toString("hex")

        const dataHex = new Buffer("this is more additionalData", "ascii").toString("hex")

        const userNonceHex = "c8010000"

        const extraNonce1 = boostpow.UInt32Big.fromHex("02000000")

        const extraNonce2 = boostpow.Bytes.fromHex("0000000300000003")

        const time = boostpow.UInt32Little.fromHex("12300009")

        const generalPurposeBits = boostpow.Int32Little.fromHex("ffffffff")

        let nonceV1 = boostpow.UInt32Little.fromNumber(151906)
        let nonceV2 = boostpow.UInt32Little.fromNumber(305455)
        let key = boostpow.bsv.PrivateKey.fromWIF("KwKYRBpVWEYdQeA4uRGAu959BN4M1WpaTuetwsoBYES8CrVkxfLt")
        let pubkey = key.toPublicKey()
        let minerPubKeyHex = pubkey.toHex()
        let minerPubKeyHashHex = boostpow.bsv.Address.fromPublicKey(pubkey, key.network).toObject().hash

        let satoshis = 7500
        let txid = boostpow.Digest32.fromHex("abcdef00112233445566778899abcdefabcdef00112233445566778899abcdef")
        let vout = 2

        const puzzleBountyV1 = new boostpow.Puzzle(
            new boostpow.Output(
                boostpow.BoostPowJob.fromObject({
                    category: categoryHex,
                    content: contentHex,
                    diff: difficulty,
                    tag: tagHex,
                    additionalData: dataHex,
                    userNonce: userNonceHex,
                }), satoshis, txid, vout), key)
        const job=new BoostJob(1,puzzleBountyV1);
        let solutionV1 = new boostpow.work.Solution(time, extraNonce1, extraNonce2, nonceV1);
        job.complete(solutionV1, "1Hh2ZrptvqCRRN2DztggtAnSyMqfc2s289",1);

    })
})
