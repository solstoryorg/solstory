use sha2::{Sha256, Digest};

/*
 * H(H(timestamp) + H(data_hash) + H(old_hash))
 */
pub fn hash_from_prev(timestamp: i64, data_hash: [u8; 32], old_hash: [u8; 32]) -> [u8; 32]{
    let timestamp_hash = Sha256::digest(timestamp.to_be_bytes());
    let conc = [*timestamp_hash.as_ref(), data_hash, old_hash].concat();

    Sha256::digest(conc).into()
}


