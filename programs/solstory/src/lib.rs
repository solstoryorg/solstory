pub mod state;
pub mod error;

use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::MyError;
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
    pub fn create_writer_writer(ctx: Context<CreateWriterWriter>, data: CreateWriterData) -> ProgramResult {
        (*ctx.accounts.writer_pda).writer_key = *ctx.accounts.owner_program.key;
        (*ctx.accounts.writer_pda).authorized = false;
        (*ctx.accounts.writer_pda).label = data.label;
        (*ctx.accounts.writer_pda).url =  data.url;
        (*ctx.accounts.writer_pda).logo =  data.logo;
        (*ctx.accounts.writer_pda).cdn =  data.cdn;

        (*ctx.accounts.writer_pda).uri =  String::new();
        (*ctx.accounts.writer_pda).hash =  [0; 16];
        (*ctx.accounts.writer_pda).prev_hash =  [0; 16];
        (*ctx.accounts.writer_pda).metadata =  String::new();

        (*ctx.accounts.writer_pda).metadata_extended = false;

        Ok(())
    }
    //pub fn update writer

    pub fn create_writer_owner(ctx: Context<CreateWriterOwner>, data: CreateWriterData) -> ProgramResult {
        (*ctx.accounts.writer_pda).writer_key = *ctx.accounts.owner_program.key;
        (*ctx.accounts.writer_pda).authorized = true;
        (*ctx.accounts.writer_pda).label = data.label;
        (*ctx.accounts.writer_pda).url =  data.url;
        (*ctx.accounts.writer_pda).logo =  data.logo;
        (*ctx.accounts.writer_pda).cdn =  data.cdn;

        (*ctx.accounts.writer_pda).uri =  String::new();
        (*ctx.accounts.writer_pda).hash =  [0; 16];
        (*ctx.accounts.writer_pda).prev_hash =  [0; 16];
        (*ctx.accounts.writer_pda).metadata =  String::new();

        (*ctx.accounts.writer_pda).metadata_extended = false;

        Ok(())
    }


    pub fn authorize_writer(ctx: Context<AuthorizeWriter>) -> ProgramResult {
        Ok(())
    }

    pub fn deauthorize_writer(ctx: Context<DeauthorizeWriter>) -> ProgramResult {
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
    #[account(signer)]
    writer_program: AccountInfo<'info>,
    //This kust be an account that inside the metaplex metadata pda has update perms
    owner_program: Signer<'info>,
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
    token_mint: AccountInfo<'info>,
    //TODO: potentially add the solstory program key into here to match the metadata pattern
    // #[account(init, payer=owner_program, seeds = [b"solstory"], bump)]
    #[account(init, payer=owner_program, space=WRITER_ACCOUNT_LEN, seeds = [b"solstory", token_mint.key().as_ref(), writer_program.key().as_ref()], bump)]
    writer_pda: Account<'info, Writer>,
    metaplex_metadata_pda: Account<'info, MetaplexMetadata>,
    system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateWriterData {
    label: String,
    url: String,
    logo: String,
    cdn: String,
}

#[derive(Accounts)]
pub struct AuthorizeWriter {
    // #[account(signer)]
    // metaplex_update_authority //call needs to be signed by a program with metaplex update auth.
    // writer_program
    // writer_pda
    // metaplex_metadata_pda
}

#[derive(Accounts)]
pub struct DeauthorizeWriter {}

#[derive(Accounts)]
pub struct ExtAppend {}

#[derive(Accounts)]
pub struct SolAppend {}
