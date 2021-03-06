pub mod state;
pub mod error;
pub mod utils;
pub mod processor;

use anchor_lang::prelude::*;
use solana_program::pubkey::PUBKEY_BYTES;
use solana_program::system_instruction;
use anchor_spl::token;
use anchor_spl::token::Mint;
use crate::processor::*;
use crate::state::*;
use crate::error::SolstoryError;

declare_id!("storyXpLfG5mZckpXWqKF8F2fQJfj8bCpFvNwHjiHqa");

/*
 * Currently the clock time in solana is extremely inaccurate,
 * occassionally varying on the order of days (at least on testnet),
 * so for now timestamp should be not be seen as an enforced constraint.
 * With current blockchain limitations we can only make strong guarantees
 * about ordering.
 */
const TIMESTAMP_ACCEPTABLE_VARIANCE:i64 = 604800_i64;
const VERIFICATION_AUTHORITY:Pubkey = solana_program::pubkey!("VeRi7PdXamQLz7yjNjt7AA2FB7Wpg9cirUf7wtxLkyF");

// This is calculated to be roughly 5% of rent.
// const SOLSTORY_HEAD_CREATION_FEE: i64 = 70000_i64;
// const SOLSTORY_FEE_DESTINATION

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
        (*ctx.accounts.writer_metadata_pda).visible =  data.visible;
        (*ctx.accounts.writer_metadata_pda).api_version =  1;
        (*ctx.accounts.writer_metadata_pda).system_verified =  false;

        if data.metadata.len() > 0{
            (*ctx.accounts.writer_metadata_pda).metadata_extended = true;
        }else{
            (*ctx.accounts.writer_metadata_pda).metadata_extended = true;
        }
        (*ctx.accounts.writer_metadata_pda).metadata =  data.metadata;
        if((*ctx.accounts.solstory_pda).writers < std::i32::MAX) {
            (*ctx.accounts.solstory_pda).writers += 1;
        }

        Ok(())
    }

    pub fn delete_writer_metadata(ctx: Context<DeleteWriterMetadata>) -> Result<()> {
        if((*ctx.accounts.solstory_pda).writers > 0) {
            (*ctx.accounts.solstory_pda).writers -= 1;
        }

        Ok(())

    }

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

        init_head_account(&mut ctx.accounts.writer_head_pda, false, &ctx.accounts.writer_program, &ctx.accounts.solstory_fee_destination, &ctx.accounts.system_program)
    }
    //pub fn update writer
    pub fn create_writer_head_creator(ctx: Context<CreateWriterHeadCreator>) -> Result<()> {
        /*
         * The following things are validated by Anchor.
         *
         * creator key has signed this call
         * token_mint is a token mint
         * writer_head_pda does not yet exist
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * creator has the update rights in the metaplex metadata pda
         * TODO: metaplex metadata is for the token mint
         */

        if (*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.creator_program.key) {
            return Err(SolstoryError::InvalidCreatorError.into())
        }

        // Make changes
        init_head_account(&mut ctx.accounts.writer_head_pda, false, &ctx.accounts.creator_program, &ctx.accounts.solstory_fee_destination, &ctx.accounts.system_program)
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
        (*ctx.accounts.writer_metadata_pda).visible =  data.visible;

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
         * creator program has signed this call
         * token_mint is a token mint
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * creator has the update rights in the metaplex metadata pda
         * TODO: metaplex metadata is for the token mint
         */

        if (*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.creator_program.key)  {
            return Err(SolstoryError::InvalidCreatorError.into())
        }
        (*ctx.accounts.writer_head_pda).authorized = true;
        Ok(())
    }

    pub fn deauthorize_writer(ctx: Context<DeauthorizeWriter>) -> Result<()> {
        /*
         * The following things are validated by Anchor.
         *
         * creator program has signed this call
         * token_mint is a token mint
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * creator has the update rights in the metaplex metadata pda
         * TODO: metaplex metadata is for the token mint
         */
        if(*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.creator_program.key) {
            return Err(SolstoryError::InvalidCreatorError.into())
        }
        (*ctx.accounts.writer_head_pda).authorized = false;
        Ok(())
    }

    pub fn create_and_append(ctx: Context<CreateAndAppend>, data: ExtAppendData) -> Result<()> {
        /*
         * The following are validated by anchor
         *
         */
        // Security wise this is a writer-create + an ext append.
        system_instruction::transfer(ctx.accounts.writer_program.key, &SOLSTORY_FEE_DESTINATION, SOLSTORY_FEE_LAMP);
        init_head_account(&mut ctx.accounts.writer_head_pda, false, &ctx.accounts.writer_program, &ctx.accounts.solstory_fee_destination, &ctx.accounts.system_program)?;
        append_data_to_writer(&mut ctx.accounts.writer_head_pda, data)
    }


    pub fn ext_append(ctx: Context<ExtAppend>, data: ExtAppendData) -> Result<()> {
        /*
         * The following things are validated by Anchor
         *  writer program is a signer
         *  token mint is a real token
         *  writer_head_pda exists and has seed (solstory, token_mind, writer_program)
         *
         * This function DOES NOT validate that the metadata exists. This is because
         * there may be many heads for one metadata, and if we put a serialization
         * lock on top of the metadata, a highly scaled writer program will not be able
         * to operate in parallel, only in sequence.
         */

        /*
         * The following things we need to validate ourselves
         * the current_hash is correct
         * - meaning it is a product of timestamp, datahash, old_current_hash
         * the timestamp is within a range of current time
         */

        append_data_to_writer(&mut ctx.accounts.writer_head_pda, data)
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

    pub fn update_visibility_index(ctx: Context<UpdateVisibilityIndex>, number:i8)->Result<()> {
        /*
         * We need to verify that the token mint has a token account that belongs
         * to the signer of this transaction.
         *
         * For an NFT that guarantees that the signer is the sole holder.
         */
        if (*ctx.accounts.token).owner != ctx.accounts.holder_key.key() {
            return Err(SolstoryError::VisibilityIndexAccessError.into())
        }
        if (*ctx.accounts.token).mint != ctx.accounts.token_mint.key() {
            return Err(SolstoryError::VisibilityIndexAccessError.into())
        }
        (*ctx.accounts.writer_head_pda).visibility_index = number;
        Ok(())
    }
    pub fn sol_append(ctx: Context<SolAppend>) -> Result<()> {
        // not supported in v1
        Err(SolstoryError::NotSupportedError.into())
        // Ok(())
    }

    pub fn set_system_verified(ctx: Context<SetSystemVerified>, value: bool)->Result<()> {
        if ctx.accounts.authority.key() != VERIFICATION_AUTHORITY {
            return Err(SolstoryError::AccessViolationError.into())
        }
        (*ctx.accounts.writer_metadata_pda).system_verified = value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, space=15, payer=authority, seeds=[b"solstory_pda"], bump)]
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
    #[account(init, payer=writer_program, space=WRITER_METADATA_LEN, seeds = [b"solstory", writer_program.key().as_ref()], bump)]
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
    #[account(init, payer=writer_program, space=WRITER_HEAD_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    system_program: Program<'info, System>,
    //'metadata' metaplex_program_id, mint_id]
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
    /// CHECK: we don't read this account
    #[account(mut, address=crate::processor::SOLSTORY_FEE_DESTINATION @ SolstoryError::AccessViolationError)]
    solstory_fee_destination: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreateWriterHeadCreator <'info>{
    /// CHECK: This is not an account we read from, it's an address that owns an NFT update auth,
    /// which we verify.
    #[account(mut, signer)]
    creator_program: AccountInfo<'info>,
    /// CHECK: This is a generic address for whic program writes to a head, it can be anything.
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=creator_program, seeds = [b"solstory"], bump)]
    #[account(init, payer=creator_program, space=WRITER_HEAD_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
    system_program: Program<'info, System>,
    /// CHECK: we don't read this account
    #[account(mut, address=crate::processor::SOLSTORY_FEE_DESTINATION @ SolstoryError::AccessViolationError)]
    solstory_fee_destination: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WriterMetadataData {
    label: String,
    description: String,
    url: String,
    logo: String,
    cdn: String,
    metadata: String,
    visible: bool,
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
    creator_program: AccountInfo<'info>,
    /// CHECK: we only use this to get a program id
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=creator_program, seeds = [b"solstory"], bump)]
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct DeauthorizeWriter<'info> {
    /// CHECK: we only use this to get a program id
    #[account(signer)]
    creator_program: AccountInfo<'info>,
    /// CHECK: we only use this to get a program id
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
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

#[derive(Accounts)]
pub struct UpdateVisibilityIndex<'info> {
    /// CHECK: we only use this to get the id of the nft holder
    #[account(signer)]
    pub holder_key: AccountInfo<'info>,
    pub token: Account<'info, token::TokenAccount>,
    /// CHECK: we only use this to get a program id
    #[account()]
    pub writer_program: AccountInfo<'info>,
    #[account()]
    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, token::Token>,
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ExtAppendData {
    pub timestamp: i64,         // timestamp of block
    pub data_hash: [u8; 32],    // hash of block data
    pub current_hash: [u8; 32],    // hash of the current first item
    pub new_hash: [u8; 32],     // hash of the new item, it's h (timestamp+data_hash+current_hash)
    pub access_type: AccessType, //how to reach the new node
    pub obj_id: [u8; 32],            // uri of current block - preferably in permanent storage
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
pub struct CreateAndAppend<'info> {
    /// CHECK: we only use this to get a program id
    #[account(mut, signer)]
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    /// CHECK: we don't read this account
    #[account(mut, address=crate::processor::SOLSTORY_FEE_DESTINATION @ SolstoryError::AccessViolationError)]
    solstory_fee_destination: AccountInfo<'info>,
    // 'solstory' solstory prog, mintid, writer_program
    #[account(init, payer=writer_program, space=WRITER_HEAD_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_head_pda: Account<'info, WriterHead>,
    system_program: Program<'info, System>,
    //'metadata' metaplex_program_id, mint_id]
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct SetSystemVerified<'info> {
    /// CHECK: we don't look into this accont
    #[account(mut, signer)]
    authority: AccountInfo<'info>,
    #[account()]
    /// CHECK: we don't look into this account
    writer_program: AccountInfo<'info>,
    #[account()]
    token_mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_metadata_pda: Account<'info, WriterMetadata>,

}

#[derive(Accounts)]
pub struct SolAppend {}
