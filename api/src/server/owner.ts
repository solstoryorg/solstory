import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import * as api from '../';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { SolstoryMetadata } from '../common/types';
import { Metadata as MetaplexMetadata } from "@metaplex-foundation/mpl-token-metadata";

/*
 * This class is for API calls that you would use as the "owner" of the nft. For Solstory's
 * purpose, owner here represents the entity with UPDATE authority over the NFT, with the
 * exception of the "visible" flag on the writer head. This is different from the HOLDER of
 * the NFT, who is the entity holding the token.
 *
 * So essentially, if you run an NFT collection, and wish to authorize a program or create
 * a set of writer heads yourself, this is where you would do it.
 *
 * Functions in this class will natively use the wallet the API was initialized with as
 * the owner key.
 */
export class SolstoryServerOwnerAPI {
  program: api.SolstoryAPI;
  ownerKey: PublicKey;
  constructor(anchorProgram: api.SolstoryAPI){
    this.program = anchorProgram;
    this.ownerKey = this.program.provider.wallet.publicKey;
  }

  /*
   * Use this to create an NFT head for your program. Remember to create
   */
  async createWriterHeadOwner(mintId:PublicKey, writerKey: PublicKey): Promise<string> {
    const writerHeadPda = await this.program.common.getWriterHeadPda(writerKey, mintId);
    const metaplexPda = await MetaplexMetadata.getPDA(mintId);

    return this.program.rpc.createWriterHeadOwner({
      accounts: {
        writerProgram: writerKey,
        ownerProgram: this.ownerKey,
        tokenMint: mintId,
        writerHeadPda: writerHeadPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplexPda,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    });
  }


  async authorizeWriterHead(mintId:PublicKey, writerKey: PublicKey): Promise<string> {
    const writerHeadPda = await this.program.common.getWriterHeadPda(writerKey, mintId);
    const metaplexPda = await MetaplexMetadata.getPDA(mintId);
    return this.program.rpc.authorizeWriterHead({
        accounts: {
          writerProgram: writerKey,
          ownerProgram: this.ownerKey,
          tokenMint: mintId,
          writerHeadPda: writerHeadPda,
          metaplexMetadataPda: metaplexPda,
        }
    });
  }

  async deauthorizeWriterHead(mintId:PublicKey, writerKey: PublicKey): Promise<string> {
    const writerHeadPda = await this.program.common.getWriterHeadPda(writerKey, mintId);
    const metaplexPda = await MetaplexMetadata.getPDA(mintId);
    return this.program.rpc.deauthorizeWriterHead({
        accounts: {
          writerProgram: writerKey,
          ownerProgram: this.ownerKey,
          tokenMint: mintId,
          writerHeadPda: writerHeadPda,
          metaplexMetadataPda: metaplexPda,
        }
    });
  }
}
