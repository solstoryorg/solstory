import * as anchor from '@project-serum/anchor';
import { Program, BN, IdlAccounts } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Solstory } from '../../target/types/solstory';
import { NodeWallet, Connection, actions} from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { airdrop, LOCALHOST } from '@metaplex-foundation/amman';
import { step, xstep } from 'mocha-steps';
import * as crypto from 'crypto';

import { timestampToBytes, solstoryHash } from '../../src/utils/index';




//metadata uri from metaplex's own NFT minting test
const metaplexMetadataURI =
  'https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link';

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const should = chai.should();
const expect = chai.expect;
chai.use(chaiAsPromised);

describe('testing hashing capabilities', () => {
  it('correctly goes from timestamp to hash', () =>{
    const testInt = 323212;

    const bytes = timestampToBytes(testInt);
    const timestampBytes = timestampToBytes(testInt);

    const timeHash = crypto.createHash('sha256');
    timeHash.update(timestampBytes);
    const timestampHash = Uint8Array.from(timeHash.digest())
    const correctBytes = Uint8Array.from([ 0, 0, 0, 0, 0, 4, 238, 140])

    return timestampBytes.should.be.deep.equal(correctBytes);

  });

  it('should create the correct hash for timestamp', () => {
    //this doesn't really test the code but verifies our hashing function approach works

    const timestamp = 323212;
    const timeHash = crypto.createHash('sha256');
    const timestampBytes = timestampToBytes(timestamp);

    const buf = Buffer.from(timestampBytes)

    timeHash.update(buf);


    const timestampHash = Uint8Array.from(timeHash.digest())

    const correct = Uint8Array.from(Buffer.from('a7073777318b0fd9d4c802eea1cf4f883fcbd3b6e7a696019f4dc93d4dddb880','hex'));

    return timestampHash.should.be.deep.equal(correct);
  });

  it('create a correct hash for a record', () => {
    //this doesn't really test the code but verifies our hashing function approach works

    const timestamp = 323212;


    const data_hash = Uint8Array.from(Buffer.from('8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52','hex'));
    const old_hash = Uint8Array.from(Buffer.from('cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4','hex'));

    const newHash = solstoryHash(timestamp, data_hash, old_hash);

    const correct = Uint8Array.from(Buffer.from('3ee1766d4fe6690d33fc9c60df1ad3e7d9da5f5916c2a3f6aa0ef6ce94ae990a','hex'));

    return newHash.should.be.deep.equal(correct);
  });
});
