import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import * as api from '../';
import { Metadata } from '../common/types';

export class SolstoryServerAPI {
  program: api.SolstoryAPI;
  constructor(anchorProgram: api.SolstoryAPI){
    this.program = anchorProgram;
  }

  /*
   * This creates a new writer and sets its initial metadata.
   *
   * SolstoryAPI _must_ be initiated with the writer key in order for this to work. If that
   * doesn't work for your usecase, consider interacting with the RPC manually, see JS tests of the
   * Solstory program for reference.
   *
   */
  async createWriterMetadata(metadata: Metadata) {
    const writerKey = this.program.provider.wallet.publicKey;
    const metadataKey = await this.program.common.getWriterMetadataPda(writerKey);

    return this.program.rpc.createWriterMetadata(metadata, {
      accounts: {
        writerProgram: writerKey,
        writerMetadataPda: metadataKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  }

  /*
   * This updates a writer's metadata.
   *
   * SolstoryAPI _must_ be initiated with the writer key in order for this to work. If that
   * doesn't work for your usecase, consider interacting with the RPC manually, see JS tests of the
   * Solstory program for reference.
   */
  async updateWriterMetadata(metadata: Metadata) {
    const writerKey = this.program.provider.wallet.publicKey;
    const metadataKey = await this.program.common.getWriterMetadataPda(writerKey);

    return this.program.rpc.updateWriterMetadata(metadata, {
      accounts: {
        writerProgram: writerKey,
        writerMetadataPda: metadataKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  }

  /*
   * This will fail if you've already set extended metadata once and youa re now attempting
   * to set _bigger_ metadata. To increase the account size, delete the extended metadata
   * account and then set it again.
   *
   * SolstoryAPI _must_ be initiated with the writer key in order for this to work. If that
   * doesn't work for your usecase, consider interacting with the RPC manually, see JS tests of the
   * Solstory program for reference.
   *
   * @param extMetadata js object of the external metadata, must be serializable as JSON
   */
  async setExtendedMetadata(extMetadata:any): Promise<string> {
    const writerKey = this.program.provider.wallet.publicKey;
    const extMetadataKey = await this.program.common.getWriterExtendedMetadataPda(writerKey);
    const metadataKey = await this.program.common.getWriterMetadataPda(writerKey);

    return this.program.rpc.setExtendedMetadata(JSON.stringify(extMetadata), {
      accounts: {
        writerProgram: writerKey,
        writerMetadataPda: metadataKey,
        extendedMetadataPda: extMetadataKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  }





}
