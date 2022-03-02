import * as crypto from 'crypto';
import * as anchor from '@project-serum/anchor';
import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { SOLSTORY_PUBKEY } from '../constants';
/* Hash function */

export const timestampToBytes = (timestamp:any) => {
    const byteTime = new Uint8Array(8);
    for (let i=0; i<8;i++) {
        // byteTime[i] = (timestamp >> i*8) % 256;
        byteTime[7-i] = (timestamp/(256**i)) % 256;
    }
    return byteTime;
}

 export const solstoryHash = (timestamp: anchor.BN, data_hash: Uint8Array, prev_hash: Uint8Array) => {

     const timeHash = crypto.createHash('sha256');
     const fullHash = crypto.createHash('sha256');

     const timestampBytes = timestampToBytes(timestamp);
     timeHash.update(timestampBytes);
     const timestampHash = Uint8Array.from(timeHash.digest())

     const full = new Uint8Array([...timestampHash, ...data_hash, ...prev_hash]);
     fullHash.update(full)

     return Uint8Array.from(fullHash.digest());
 }


