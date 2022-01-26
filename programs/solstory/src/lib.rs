pub mod state;
pub mod error;

use anchor_lang::prelude::*;
use anchor_spl::token;
use crate::state::*;
use crate::error::SolstoryError;
use metaplex_token_metadata::state::Metadata;

declare_id!("H3iPPJ6td4XPAVmBsygE8NxjnmAgeafPktr59JiV4jAv");

#[program]
pub mod solstory {
    use super::*;
    // This is a function def
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        (*ctx.accounts.solstory_pda).initialized = true;
        (*ctx.accounts.solstory_pda).writers = 0;
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
    pub fn create_writer_writer(ctx: Context<CreateWriterWriter>, data: WriterData) -> ProgramResult {

        /*
         * The following things are validated by Anchor.
         *
         * writer program has signed this call
         * token_mint is a token mint
         * writer_pda does not yet exist
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         *  the metaplex metadata exists.
         */

        /*
         * The following things we need to validate ourselves:
         * nothing - anyone is allowed to write to any NFT just not authorize it
         */
        (*ctx.accounts.writer_pda).writer_key = *ctx.accounts.writer_program.key;
        (*ctx.accounts.writer_pda).authorized = false;
        (*ctx.accounts.writer_pda).label = data.label;
        (*ctx.accounts.writer_pda).url =  data.url;
        (*ctx.accounts.writer_pda).logo =  data.logo;
        (*ctx.accounts.writer_pda).cdn =  data.cdn;

        if data.metadata.len() > 0{
            (*ctx.accounts.writer_pda).metadata_extended = true;
        }else{
            (*ctx.accounts.writer_pda).metadata_extended = true;
        }
        (*ctx.accounts.writer_pda).metadata =  data.metadata;

        (*ctx.accounts.writer_pda).uri =  String::new();
        (*ctx.accounts.writer_pda).hash =  [0; 16];
        (*ctx.accounts.writer_pda).prev_hash =  [0; 16];

        Ok(())
    }
    //pub fn update writer
    pub fn create_writer_owner(ctx: Context<CreateWriterOwner>, data: WriterData) -> ProgramResult {
        /*
         * The following things are validated by Anchor.
         *
         * owner program has signed this call
         * token_mint is a token mint
         * writer_pda does not yet exist
         * the writer pda has seed('solstory', token_mint.key, writer_program.key)
         * the metaplex metadata pda exists
         */

        /*
         * The following things we need to validate ourselves:
         * owner has the rights in the metaplex metadata pdak
         */

        if((*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.owner_program.key)) {
            return Err(SolstoryError::InvalidOwnerError.into())
        }

        // Make changes

        (*ctx.accounts.writer_pda).writer_key = *ctx.accounts.writer_program.key;
        (*ctx.accounts.writer_pda).authorized = true;
        (*ctx.accounts.writer_pda).label = data.label;
        (*ctx.accounts.writer_pda).url =  data.url;
        (*ctx.accounts.writer_pda).logo =  data.logo;
        (*ctx.accounts.writer_pda).cdn =  data.cdn;

        if data.metadata.len() > 0{
            (*ctx.accounts.writer_pda).metadata_extended = true;
        }else{
            (*ctx.accounts.writer_pda).metadata_extended = true;
        }
        (*ctx.accounts.writer_pda).metadata =  data.metadata;

        (*ctx.accounts.writer_pda).uri =  String::new();
        (*ctx.accounts.writer_pda).hash =  [0; 16];
        (*ctx.accounts.writer_pda).prev_hash =  [0; 16];

        Ok(())
    }

    /*
     * This function allows a writer program to update its own base properties.
     * These include the label, url, logo, and cdn and metadata/extended.
     */
    pub fn update_writer_writer(ctx: Context<UpdateWriterWriter>, data: WriterData) -> ProgramResult {
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
         * nothing - anyone is allowed to write to their own metadata
         */

        (*ctx.accounts.writer_pda).label = data.label;
        (*ctx.accounts.writer_pda).url =  data.url;
        (*ctx.accounts.writer_pda).logo =  data.logo;
        (*ctx.accounts.writer_pda).cdn =  data.cdn;

        if data.metadata.len() > 0{
            (*ctx.accounts.writer_pda).metadata_extended = true;
        }else{
            (*ctx.accounts.writer_pda).metadata_extended = true;
        }

        (*ctx.accounts.writer_pda).metadata =  data.metadata;

        Ok(())
    }

    pub fn authorize_writer(ctx: Context<AuthorizeWriter>) -> ProgramResult {
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
         */

        if((*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.owner_program.key)) {
            return Err(SolstoryError::InvalidOwnerError.into())
        }
        (*ctx.accounts.writer_pda).authorized = true;
        Ok(())
    }

    pub fn deauthorize_writer(ctx: Context<DeauthorizeWriter>) -> ProgramResult {
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
         */
        if((*ctx.accounts.metaplex_metadata_pda).update_authority != (*ctx.accounts.owner_program.key)) {
            return Err(SolstoryError::InvalidOwnerError.into())
        }
        (*ctx.accounts.writer_pda).authorized = false;
        Ok(())
    }


    pub fn ext_append(ctx: Context<ExtAppend>) -> ProgramResult {
        Ok(())
        // we want to emit! here
    }

    pub fn sol_append(ctx: Context<SolAppend>) -> ProgramResult {
        Ok(())
        // we want to emit! here
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=authority, seeds=[b"solstory_pda"], bump)]
    solstory_pda: Account<'info, SolstoryPDA>,
    //check that this is this program and then check that auth has update rights
    authority: Signer<'info>,
    system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct CreateWriterWriter<'info> {
    #[account(mut, signer)]
    writer_program: AccountInfo<'info>,
    #[account(owner = token::ID)]
    token_mint: AccountInfo<'info>,
    // 'solstory' solstory prog, mintid, writer_program
    #[account(init, payer=writer_program, space=WRITER_ACCOUNT_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_pda: Account<'info, Writer>,
    system_program: Program<'info, System>,
    //'metadata' metaplex_program_id, mint_id]
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct CreateWriterOwner <'info>{
    #[account(mut, signer)]
    owner_program: AccountInfo<'info>,
    writer_program: AccountInfo<'info>,
    #[account(owner = token::ID)]
    token_mint: AccountInfo<'info>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(init, payer=owner_program, space=WRITER_ACCOUNT_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_pda: Account<'info, Writer>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
    system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WriterData {
    label: String,
    url: String,
    logo: String,
    cdn: String,
    metadata: String,
}

#[derive(Accounts)]
pub struct UpdateWriterWriter<'info> {
    #[account(signer)]
    writer_program: AccountInfo<'info>,
    #[account(owner = token::ID)]
    token_mint: AccountInfo<'info>,
    // 'solstory' solstory prog, mintid, writer_program
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_pda: Account<'info, Writer>,
    system_program: Program<'info, System>,
    //'metadata' metaplex_program_id, mint_id]
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}


#[derive(Accounts)]
pub struct AuthorizeWriter<'info> {
    #[account(signer)]
    owner_program: AccountInfo<'info>,
    writer_program: AccountInfo<'info>,
    #[account(owner = token::ID)]
    token_mint: AccountInfo<'info>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_pda: Account<'info, Writer>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}

#[derive(Accounts)]
pub struct DeauthorizeWriter<'info> {
    #[account(signer)]
    owner_program: AccountInfo<'info>,
    writer_program: AccountInfo<'info>,
    #[account(owner = token::ID)]
    token_mint: AccountInfo<'info>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(mut, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_pda: Account<'info, Writer>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
}



#[derive(Accounts)]
pub struct ExtAppend {}

#[derive(Accounts)]
pub struct SolAppend {}
