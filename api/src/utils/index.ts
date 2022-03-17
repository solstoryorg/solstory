import sha256 from 'crypto-js/sha256';
import CryptoJS from 'crypto-js';
import * as anchor from '@project-serum/anchor';

export * from './retrievers'

/* Hash function */

export const timestampToBytes = (timestamp:any) => {
    const byteTime = new Uint8Array(8);
    for (var i=0; i<8; i++) {
        // byteTime[i] = (timestamp >> i*8) % 256;
        byteTime[7-i] = (timestamp/(256**i)) % 256;
    }
    return byteTime;
}

export const simpleHash = (input:string) => {
    const hash = sha256(CryptoJS.enc.Hex.parse(input)).toString();

    return hash
}

 export const solstoryHash = (timestamp: anchor.BN|number, data_hash: Uint8Array|string, nextHash: Uint8Array|string):Uint8Array => {

     if(typeof data_hash == "string"){
         data_hash = Uint8Array.from(Buffer.from(data_hash, 'hex'));
     }
     if(typeof nextHash == "string"){
         nextHash = Uint8Array.from(Buffer.from(nextHash, 'hex'));
     }
     if(typeof timestamp == "number"){
         timestamp = new anchor.BN(timestamp);
     }

     const u8ToWords = (u8: Uint8Array) => {
         const hexstring = Buffer.from(u8).toString('hex');
         const words = CryptoJS.enc.Hex.parse(hexstring)
         return words;
     }

     const u8FromHashOut = (out:any) => {
         const hexstring = out.toString();
         const buff = Buffer.from(hexstring, 'hex');
         const u8 = Uint8Array.from(buff);
         return u8;

     }



     const timestampBytes = timestampToBytes(timestamp);
     const timeHash = sha256(u8ToWords(timestampBytes));

     const timestampHash = u8FromHashOut(timeHash);

     const full = new Uint8Array([...timestampHash, ...data_hash, ...nextHash]);

     return u8FromHashOut(sha256(u8ToWords(full)))
 }
