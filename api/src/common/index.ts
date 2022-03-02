import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
// import { solstoryProgram } from '../programs'


/**
 * This is for common things between the client and server
 * generally concerning data lookup
 */

export class SolstoryCommonAPI {
  program: Program;
  constructor(program:Program) {
    this.program = program;
  }

  /**
   * Grab the PDA address for the metadata of a writer program.
   *
   * @param writerKey the pubkey of the writer program
   **/
  async getWriterMetadataPda(writerKey: PublicKey): Promise<PublicKey> {
    return PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerKey.toBuffer()],
      this.program.programId
    ).then((value: [writerMetadataPda:PublicKey, _nonce:number]) => {
      return value[0];
    });
  }

  /**
   * Grab the PDA address for the metadata of a writer program.
   *
   * @param writerKey the pubkey of the writer program
   **/
  async getWriterExtendedMetadataPda(writerKey: PublicKey): Promise<PublicKey> {
    return PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerKey.toBuffer()],
      this.program.programId
    ).then((value: [writerMetadataPda:PublicKey, _nonce:number]) => {
      return value[0];
    });
  }

  /**
   * Grab the PDA address for the "head" of a story for an nft.
   *
   * @param writerKey the pubkey of the writer program
   * @param mintKey the mint of the NFT – this is the same one you would use for metaplex metadata.
   **/
  async getWriterHeadPda(writerKey: PublicKey, mintKey: PublicKey): Promise<PublicKey> {
    return PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mintKey.toBuffer(), writerKey.toBuffer()],
      this.program.programId
    ).then((value: [writerHeadKey:PublicKey, _nonce:number]) => {
      return value[0];
    });
  }
}

