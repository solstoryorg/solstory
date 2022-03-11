pub mod state;
pub mod error;
pub mod utils;

use anchor_lang::prelude::*;
use solana_program::pubkey::PUBKEY_BYTES;
use anchor_spl::token;
use anchor_spl::token::Mint;
use crate::utils::*;
use crate::state::*;
use crate::error::SolstoryError;

declare_id!("H3iPPJ6td4XPAVmBsygE8NxjnmAgeafPktr59JiV4jAv");

/*
 * Currently the clock time in solana is extremely inaccurate,
 * occassionally varying on the order of days (at least on testnet),
 * so for now timestamp should be not be seen as an enforced constraint.
 * With current blockchain limitations we can only make strong guarantees
 * about ordering.
 */
const TIMESTAMP_ACCEPTABLE_VARIANCE:i64 = 604800_i64;

#[program]
pub mod solstory {
    use super::*;
    // This is a function def
    pub fn initialize(ctx: Context<Initialize>) -> Result<()>{
        (*ctx.accounts.solstory_pda).initialized = true;
        (*ctx.accounts.solstory_pda).writers = 0;
        Ok(())
    }

    pub fn create_writer_metadata(ctx: Context<CreateWriterMetadata>, data: WriterMetadataData) -> Result<()> {
        (*ctx.accounts.writer_metadata_pda).writer_key = *ctx.accounts.writer_program.key;
        (*ctx.accounts.writer_metadata_pda).label = data.label;
        (*ctx.accounts.writer_metadata_pda).url =  data.url;
        (*ctx.accounts.writer_metadata_pda).logo =  data.logo;
        (*ctx.accounts.writer_metadata_pda).description = data.description;
        (*ctx.accounts.writer_metadata_pda).cdn =  data.cdn;

        if data.metadata.len() > 0{
            (*ctx.accounts.writer_metadata_pda).metadata_extended = true;
        }else{
            (*ctx.accounts.writer_metadata_pda).metadata_extended = true;
        }
        (*ctx.accounts.writer_metadata_pda).metadata =  data.metadata;
        (*ctx.accounts.solstory_pda).writers += 1;

        Ok(())
    }

    pub fn delete_writer_metadata(ctx: Context<DeleteWriterMetadata>) -> Result<()> {
        (*ctx.accounts.solstory_pda).writers -= 1;

        Ok(())

    }


    /// Create Writer
    ///
    /// Here we create an onchain PDA for the writer.
    /// This program should create the account and fill in basic details
    ///
    /// writer_program
    /// label
    /// url
    /// logo
    /// cdn (opt)
    ///
    /// constraints:
    /// this program can be called by either the writer program
    /// or the update authority (creator of the NFT)
    /// THIS DOES NOT GUARD AGAINST ANY SORT OF INJECTION INPUT
    /*
     * Create Writer Head
     * Here we create the head of the hashlist. Two almost identical functions,
     * but
     *
     */
    pub fn create_writer_head_writer(ctx: Context<CreateWriterHeadWriter>) -> Result<()> {

        /*
         * The following things are validated by Anchor.
         *
         * writer program has signed this call
         * token_mint is a token mint
         * writer_head_pda does not yet exist
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         *  the metaplex metadata is a pda that exists.
         */

        /*
         * The following things we need to validate ourselves:
         * nothing - anyone is allowed to write to any NFT just not authorize it
         * TODO: the metaplex pda is for the token mint
         */
        // (*ctx.accounts.writer_head_pda).writer_key = *ctx.accounts.writer_program.key;
        (*ctx.accounts.writer_head_pda).authorized = false;
        (*ctx.accounts.writer_head_pda).visible_override = HolderOverride::Default;

        // (*ctx.accounts.writer_pda).uri =  String::new();
        (*ctx.accounts.writer_head_pda).obj_id =  [0; 32];
        (*ctx.accounts.writer_head_pda).current_hash =  [0; 32];

        Ok(())
    }
    //pub fn update writer
    pub fn create_writer_head_owner(ctx: Context<CreateWriterHeadOwner>) -> Result<()> {
        /*
         * The following things are validated by Anchor.
         *
         * owner program has signed this call
         * token_mint is a token mint
         * writer_head_pda does not yet exist
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * owner has the rights in the metaplex metadata pdak
         * TODO: metaplex metadata is for the token mint
         */

        if (*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.owner_program.key) {
            return Err(SolstoryError::InvalidOwnerError.into())
        }

        // Make changes

        // (*ctx.accounts.writer_head_pda).writer_key = *ctx.accounts.writer_program.key;
        (*ctx.accounts.writer_head_pda).authorized = true;
        (*ctx.accounts.writer_head_pda).visible_override = HolderOverride::Default;

        (*ctx.accounts.writer_head_pda).obj_id = [0; 32];
        (*ctx.accounts.writer_head_pda).current_hash = [0; 32];

        Ok(())
    }

    /*
     * This function allows a writer program to update its own base properties.
     * These include the label, url, logo, and cdn and metadata/extended.
     */
    pub fn update_writer_metadata(ctx: Context<UpdateWriterMetadata>, data: WriterMetadataData) -> Result<()> {
        /*
         * The following things are validated by Anchor.
         *
         * writer program has signed this call
         * token_mint is a token mint
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         *  the metaplex metadata exists.
         */

        /*
         * The following things we need to validate ourselves:
         * TODO: metaplex metadata is for the token mint
         */

        //We don't update the writer_key here because it can only be set once and must be the same.
        (*ctx.accounts.writer_metadata_pda).label = data.label;
        (*ctx.accounts.writer_metadata_pda).url =  data.url;
        (*ctx.accounts.writer_metadata_pda).logo =  data.logo;
        (*ctx.accounts.writer_metadata_pda).description = data.description;
        (*ctx.accounts.writer_metadata_pda).cdn =  data.cdn;

        if data.metadata.len() > 0{
            (*ctx.accounts.writer_metadata_pda).metadata_extended = true;
        }else{
            (*ctx.accounts.writer_metadata_pda).metadata_extended = true;
        }

        (*ctx.accounts.writer_metadata_pda).metadata =  data.metadata;

        Ok(())
    }

    pub fn authorize_writer(ctx: Context<AuthorizeWriter>) -> Result<()> {
        /*
         * The following things are validated by Anchor.
         *
         * owner program has signed this call
         * token_mint is a token mint
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * owner has the rights in the metaplex metadata pdak
         * TODO: metaplex metadata is for the token mint
         */

        if((*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.owner_program.key)) {
            return Err(SolstoryError::InvalidOwnerError.into())
        }
        (*ctx.accounts.writer_head_pda).authorized = true;
        Ok(())
    }

    pub fn deauthorize_writer(ctx: Context<DeauthorizeWriter>) -> Result<()> {
        /*
         * The following things are validated by Anchor.
         *
         * owner program has signed this call
         * token_mint is a token mint
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * owner has the rights in the metaplex metadata pdak
         * TODO: metaplex metadata is for the token mint
         */
        if((*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.owner_program.key)) {
            return Err(SolstoryError::InvalidOwnerError.into())
        }
        (*ctx.accounts.writer_head_pda).authorized = false;
        Ok(())
    }


    pub fn ext_append(ctx: Context<ExtAppend>, data: ExtAppendData) -> Result<()> {
        /*
         * The following things are validated by Anchor
         *  writer program is a signer
         *  token mint is a real token
         *  writer_head_pda exists and has seed (solstory, token_mind, writer_program)
         */

        /*
         * The following things we need to validate ourselves
         * the prev_hash is correct
         * - meaning it is a product of old_timestamp, old_datahash, old_prev_hash
         * the timestamp is within a range of current time
         */

        let hash = hash_from_prev(data.timestamp, data.data_hash, data.prev_hash);
        msg!("hash: {:?}", hash);
        if hash != data.new_hash {
            return Err(SolstoryError::HashMismatchError.into())
        }

        let cur_time:i64 = (Clock::get()?).unix_timestamp;
        msg!("current time: {:?}", cur_time);
        msg!("timestamp time: {:?}", data.timestamp);

        // As mentioned above, this should be treated as a santiy check more than anything
        if (data.timestamp-cur_time).abs() > TIMESTAMP_ACCEPTABLE_VARIANCE {
            return Err(SolstoryError::TimestampRangeError.into())
        }

        if data.prev_hash != (*ctx.accounts.writer_head_pda).current_hash {
            return Err(SolstoryError::HashMismatchError.into())
        }


        // (*ctx.accounts.writer_head_pda).uri =  data.uri;
        (*ctx.accounts.writer_head_pda).current_hash =  hash;


        Ok(())
        // we want to emit! here
    }

    pub fn set_extended_metadata(ctx: Context<SetExtendedMetadata>, metadata_json: String)->Result<()>{
        (*ctx.accounts.extended_metadata_pda).writer_key = *ctx.accounts.writer_program.key;
        (*ctx.accounts.extended_metadata_pda).extended_metadata = metadata_json;

        Ok(())
    }

    pub fn delete_extended_metadata(ctx: Context<DeleteExtendedMetadata>)->Result<()>{
        // close is called by anchor, we just ok out
        Ok(())
    }

    pub fn sol_append(ctx: Context<SolAppend>) -> Result<()> {
        // not supported in v1
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=authority, seeds=[b"solstory_pda"], bump)]
    solstory_pda: Account<'info, SolstoryPDA>,
    //check that this is this program and then check that auth has update rights
    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,

}
#[derive(Accounts)]
pub struct CreateWriterMetadata<'info> {
    /// CHECK: we only use this to get a program id
    #[account(mut, signer)]
    writer_program: AccountInfo<'info>,
    #[account(init, payer=writer_program, space=WRITER_ACCOUNT_LEN, seeds = [b"solstory", writer_program.key().as_ref()], bump)]
    writer_metadata_pda: Account<'info, WriterMetadata>,
    system_program: Program<'info, System>,
    #[account(mut, seeds=[b"solstory_pda"], bump)]
    solstory_pda: Account<'info, SolstoryPDA>,
}

#[derive(Accounts)]
pub struct DeleteWriterMetadata<'info> {
    /// CHECK: we only use this to get a program id
    #[account(mut, signer)]
    writer_program: AccountInfo<'info>,
    #[account(mut, close=writer_program, seeds = [b"solstory", writer_program.key().as_ref()], bump)]
    writer_metadata_pda: Account<'info, WriterMetadata>,
    system_program: Program<'info, System>,
    #[account(mut, seeds=[b"solstory_pda"], bump)]
    solstory_pda: Account<'info, SolstoryPDA>,
}

#[derive(Accounts)]
pub struct CreateWriterHeadWriter<'info> {
    /// CHECK: we only use this to get a program id
    #[account(mut, signer)]
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    // 'solstory' solstory prog, mintid, writer_program
    #[account(init, payer=writer_program, space=WRITER_ACCOUNT_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    system_program: Program<'info, System>,
    //'metadata' metaplex_program_id, mint_id]
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct CreateWriterHeadOwner <'info>{
    /// CHECK: This is not an account we read from, it's an address that owns an NFT update auth,
    /// which we verify.
    #[account(mut, signer)]
    owner_program: AccountInfo<'info>,
    /// CHECK: This is a generic address for whic program writes to a head, it can be anything.
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(init, payer=owner_program, space=WRITER_ACCOUNT_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
    system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WriterMetadataData {
    label: String,
    description: String,
    url: String,
    logo: String,
    cdn: String,
    metadata: String,
}

#[derive(Accounts)]
pub struct UpdateWriterMetadata<'info> {
    /// CHECK: we only use this to get a program id
    #[account(signer)]
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    // 'solstory' solstory prog, mintid, writer_program
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_metadata_pda: Account<'info, WriterMetadata>,
    system_program: Program<'info, System>,
    //'metadata' metaplex_program_id, mint_id]
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}


#[derive(Accounts)]
pub struct AuthorizeWriter<'info> {
    /// CHECK: we only use this to get a program id
    #[account(signer)]
    owner_program: AccountInfo<'info>,
    /// CHECK: we only use this to get a program id
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct DeauthorizeWriter<'info> {
    /// CHECK: we only use this to get a program id
    #[account(signer)]
    owner_program: AccountInfo<'info>,
    /// CHECK: we only use this to get a program id
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct DeleteExtendedMetadata<'info> {
    /// CHECK: we only use this to get a program id
    #[account(mut, signer)]
    pub writer_program: AccountInfo<'info>,
    #[account(mut, seeds = [b"solstory", b"extended", writer_program.key().as_ref()], bump, close=writer_program)]
    pub extended_metadata_pda: Account<'info, ExtendedMetadata>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(metadata_json:String)]
pub struct SetExtendedMetadata<'info> {
    /// CHECK: we only use this to get a program id
    #[account(mut, signer)]
    pub writer_program: AccountInfo<'info>,
    #[account(init_if_needed, payer=writer_program, seeds = [b"solstory", b"extended", writer_program.key().as_ref()], bump, space=12+PUBKEY_BYTES+metadata_json.len())]
    pub extended_metadata_pda: Account<'info, ExtendedMetadata>,
    pub system_program: Program<'info, System>,

}


#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ExtAppendData {
    pub timestamp: i64,         // timestamp of block
    pub data_hash: [u8; 32],    // hash of block data
    pub prev_hash: [u8; 32],    // hash of the last blocks timestamp, data, and prev_hash
    pub new_hash: [u8; 32],     // verification step for safety
    pub id: [u8; 32],            // uri of current block - preferably in permanent storage
}

#[derive(Accounts)]
pub struct ExtAppend<'info> {
    /// CHECK: we only use this to get a program id
    #[account(signer)]
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
}

#[derive(Accounts)]
pub struct SolAppend {}
