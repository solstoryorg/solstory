import * as crypto from 'crypto';




/* Hash function */

export const timestampToBytes = (timestamp) => {
    const byteTime = new Uint8Array(8);
    for (let i=0; i<8;i++) {
        // byteTime[i] = (timestamp >> i*8) % 256;
        byteTime[7-i] = (timestamp/(256**i)) % 256;
    }
    return byteTime;
}



export const solstoryHash = (timestamp: BigInt, data_hash: Uint8Array, prev_hash: Uint8Array) => {

    const timeHash = crypto.createHash('sha256');
    const fullHash = crypto.createHash('sha256');

    const timestampBytes = timestampToBytes(timestamp);
    timeHash.update(timestampBytes);
    const timestampHash = Uint8Array.from(timeHash.digest())

    const full = new Uint8Array([...timestampHash, ...data_hash, ...prev_hash]);
    fullHash.update(full)

    return Uint8Array.from(fullHash.digest());

}



/*
pub fn hash_from_prev(timestamp: i64, data_hash: [u8; 32], old_hash: [u8; 32]) -> [u8; 32]{
    let bytes =timestamp.to_be_bytes(); //this zero pads into u8 size chunks so gotta make sure js does as well
    println!("{:x?}",bytes);
    let timestamp_hash = Sha256::digest(bytes);
    let conc = [*timestamp_hash.as_ref(), data_hash, old_hash].concat();
    println!("{:x?}",conc);

    Sha256::digest(conc).into()
}
*/
