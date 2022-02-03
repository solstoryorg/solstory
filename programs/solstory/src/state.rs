use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize, maybestd::io};
use arraystring::{ArrayString, typenum::U192, typenum::U255};
use metaplex_token_metadata::state::{Metadata, Key, MAX_METADATA_LEN};
use std::ops::Deref;

// pub const METAPLEX_METADATA_ID:Pubkey = metaplex_token_metadata::id();
pub const METAPLEX_METADATA_ID:Pubkey = solana_program::pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
pub const WRITER_ACCOUNT_LEN:usize = 8 +
32 + //writer key
1 + //authorized
128 + //label
(192 * 4) + // url, logo, cdn, uri
32*2 + // the two hashes
280 + //Tweet length metadata
1; //Extended metadata




// struct ArrayString192(ArrayString<U192>);

// impl Deref for ArrayString192 {
//     fn deref(&self) -> &ArrayString<U192> {
//         &self.0
//     }
// }

// impl BorshDeserialize for ArrayString192 {
//     fn deserialize(buf: &mut &[u8]){
//         String::BorshDeserialize(buf);
//     }
// }

// impl BorshSerialize for ArrayString192 {
//     fn serialize<W>(&self, writer: &mut W) -> io::Result<()>{
//         String::BorshSerialize(&self, writer);
//     }
// }



/// Two account data structures
/// main account
/// writer account
/// record account
// (program, metaplex-metadata-account)
#[account]
#[derive(Default)]
pub struct SolstoryPDA {
    // cdn??
    pub initialized: bool,
    pub writers: i32,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum AccessType {
    ArDrive,
    URL,
    PDA,
}

impl Default for AccessType {
    fn default() -> Self { AccessType::URL }
}

//only writer-program can modify
//this is a writer attached to a particular single instance nft (mint)
// pda('solstory' solstory prog, writer_program)
#[account]
#[derive(Default)]
pub struct WriterMetadata {
    //for NFT owner
    // This can be a program _or_ an authorizing key.
    pub writer_key: Pubkey, //this is used for the memcpy search
    pub visible: bool,
    pub access_type: AccessType,


    //for writer, semi-static
    pub label: String, // 128
    pub url: String, // 192
    pub logo: String, // 192
    pub cdn: String, // 192, //semi static
    pub metadata: String, //use this for whateever
    pub base_url: String, //192 only meaningful in cases where AccessType=URL

    //TODO: Determine metadata PDA standard
    pub metadata_extended: bool, // suggests the existence of a an additional metadata pda.
}

/*
 * In theory we can just put this in the spec and then
 * allow wallets to hard override in local _but_ we want to make things
 * as on chain as possible and this is relatively cheap for us to implement.
 */
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum HolderOverride {
    Default,
    Visible,
    Hidden,
}

impl Default for HolderOverride {
    fn default() -> Self { HolderOverride::Default }
}
// only writer-program can modify
// this is a writer attached to a particular single instance nft (mint)
// pda('solstory' solstory prog, mintid, writer_program)
#[account]
#[derive(Default)]
pub struct WriterHead {
    //for NFT owner
    // This can be a program _or_ an authorizing key.
    pub writer_key: Pubkey, //this is used for the memcpy search
    pub authorized: bool,
    pub visible_override: HolderOverride, //Allow the holder of the NFT to hard-override things.

    //if we hard use cdn or ARdrive
    pub uuid: [u8; 16],
    pub current_hash: [u8; 32],
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
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self, ProgramError>{
        // create an Ok(metadata) object that we map MetaplexMetadata TO
        // thereby creating a MetaplexMetadata tuple with Metadata in it.
        metaplex_token_metadata::utils::try_from_slice_checked(&buf, Key::MetadataV1, MAX_METADATA_LEN).map(MetaplexMetadata)
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
