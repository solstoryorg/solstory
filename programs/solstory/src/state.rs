use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize, maybestd::io};
use arraystring::{ArrayString, typenum::U192, typenum::U255};
use metaplex_token_metadata::state::{Metadata, Key, MAX_METADATA_LEN};
use std::ops::Deref;

use crate::error::SolstoryError;

// pub const METAPLEX_METADATA_ID:Pubkey = metaplex_token_metadata::id();
pub const METAPLEX_METADATA_ID:Pubkey = solana_program::pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
pub const WRITER_METADATA_LEN:usize = 8 +
32 + //writer key
1 + //visible
1 + //system verified
1 + //api version
128 + //label
(192 * 4) + // url, logo, cdn, base_url
280 + //Tweet length metadata
1; //Extended metadata

pub const WRITER_HEAD_LEN:usize = 8 +
1 + // authorized
1 + //visibility index
1 + //access type
32 + // obj_id
32; //current_hash






#[account]
#[derive(Default)]
pub struct SolstoryPDA {
    pub initialized: bool,
    pub writers: i32,
}

// Make sure to upgrade typescript enum when changing this
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum AccessType {
    Ardrive,
    Url,
    Pda,
    None,
}

impl Default for AccessType {
    fn default() -> Self { AccessType::None }
}

//only writer-program can modify
//this is a writer attached to a particular single instance nft (mint)
// pda('solstory' solstory prog, writer_program)
#[account]
#[derive(Default)]
pub struct WriterMetadata {
    //for NFT owner
    // This is the public key representing the writer.
    pub writer_key: Pubkey, //32
    // This is used for the Writer Program to determine if users should see this
    // A writer program storing progress information for a video game, for example,
    // might set this to false.
    pub visible: bool, //1
    // Marks programs that have been verified by solstory org. Protection against
    // spam, phishing, ect.
    pub system_verified: bool, // 1
    pub api_version: u8, // 1

    //for writer, semi-static
    pub label: String, // 128
    pub description: String, // 128
    pub url: String, // 192
    pub logo: String, // 192
    pub cdn: String, // 192, //semi static
    pub base_url: String, //192 only meaningful in cases where AccessType=URL

    pub metadata: String, // 280 metadata

    pub metadata_extended: bool, // 1 suggests the existence of a an additional metadata pda.
}

/*
 * Head of the hashlist.
 */
// pda('solstory' solstory prog, mintid, writer_program)
#[account]
#[derive(Default)]
pub struct WriterHead {
    // We make a deliberate choice here: we can save 64 bytes by removing the ability
    // to programatically load all heads of a program and by finding every head of
    // an NFT by iterating through every single program via getMultipleAccounts
    //
    // Even up to 10^3 writer programs, I'd rather send 10x more requests (10x 100 acts per
    // request vs a single prog-accts-filter-on-buffer) than increase cost of storage by ~35%.
    //
    // This should only be a fallback anyway, since we _should_ be using a CDN for standard
    // lookups.
    //
    // pub writer_key: Pubkey, //this is used for the memcpy search
    // pub nft_key: Pubkey, //this is used for the memcpy search

    pub authorized: bool,

    // UNDER CONSIDERATION
    // Holder override allows the holder of the NFT to override settings.
    // -1 represents hiding something
    // 0 represents default
    // 1 represents deliberately making something visible
    pub visibility_index: i8, //Allow the holder of the NFT to hard-override things.

    //keeping access type in head allows for multiple types of nodes
    pub access_type: AccessType,
    // pub access_type: i32,
    pub obj_id: [u8; 32],
    pub current_hash: [u8; 32],
}

#[account]
pub struct ExtendedMetadata {
    pub writer_key: Pubkey, //this is used for the memcpy search
    pub extended_metadata: String
}
// This entire section pulled from
// https://docs.rs/anchor-lang/0.20.0/anchor_lang/accounts/account/struct.Account.html#impl-Accounts%3C%27info%3E
#[derive(Clone)]
pub struct MetaplexMetadata (Metadata);

impl MetaplexMetadata {
    // this is the MAX size instead fo the SIZE but it should work in a pinch?
    // TODO: check if incorrect sizing will lead to buffer overlow
    // pub const LEN: usize = MAX_METADATA_LEN;
    // maybe leave this unimplemented for now.
}


impl anchor_lang::AccountDeserialize for MetaplexMetadata{
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self>{
        // create an Ok(metadata) object that we map MetaplexMetadata TO
        // thereby creating a MetaplexMetadata tuple with Metadata in it.
        let out = metaplex_token_metadata::utils::try_from_slice_checked(&buf, Key::MetadataV1, MAX_METADATA_LEN).map(MetaplexMetadata);
        match out {
            Ok(out) => Ok(out),
            Err(out) => Err(error!(SolstoryError::MetaplexDeserializeError))
        }

    }
}

// Null op since we can't write to a foreign program.
impl anchor_lang::AccountSerialize for MetaplexMetadata {}

impl anchor_lang::Owner for MetaplexMetadata {
    fn owner() -> Pubkey {
        METAPLEX_METADATA_ID
    }
}

impl std::ops::Deref for MetaplexMetadata {
    type Target = metaplex_token_metadata::state::Metadata;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

// (program, metaplex-metadata-account, some-kind-of-id)
// Special onchain container for solstory items. We typically expect these to be
// off chain on (ideally) permanent storage like ardrive.
#[account]
pub struct SolstoryItem {
    // whatever?
    // json
}
