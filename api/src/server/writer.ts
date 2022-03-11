import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import * as api from '../';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { Metadata, UpdateHeadData, SolstoryItemContainer, SolstoryItemInner, SolstoryItemType } from '../common/types';
import { simpleHash, solstoryHash } from '../utils';
import { Metadata as MetaplexMetadata } from "@metaplex-foundation/mpl-token-metadata";
import ARWeave from 'arweave';

/*
 * This class is for API calls that you would use as the writer program. They'll
 * natively use the wallet the API was initialized with as the writer key.
 */
export class SolstoryServerWriterAPI {
  program: api.SolstoryAPI;
  writerKey: PublicKey;
  constructor(anchorProgram: api.SolstoryAPI){
    this.program = anchorProgram;
    this.writerKey = this.program.provider.wallet.publicKey;
  }

  /*
   * This creates a new writer and sets its initial metadata.
   *
   * SolstoryAPI _must_ be initiated with the writer key in order for this to work. If that
   * doesn't work for your usecase, consider interacting with the RPC manually, see JS tests of the
   * Solstory program for reference.
   *
   * This should _only_ need to be called once per program. If you have a use case where it needs
   * to be called more, please contact me because there's a v2 to make that viable in the architecture.
   * Mass usage ahead of the V2 will not be system validated to avoid degrading API performance.
   */
  async createWriterMetadata(metadata: Metadata) {
    const metadataKey = await this.program.common.getWriterMetadataPda(this.writerKey);
    const solstoryPda = await this.program.common.getSolstoryPda();

    return this.program.rpc.createWriterMetadata(metadata, {
      accounts: {
        writerProgram: this.writerKey,
        writerMetadataPda: metadataKey,
        solstoryPda: solstoryPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  }


  /*
   * This deletes a writer.
   *
   * SolstoryAPI _must_ be initiated with the writer key in order for this to work. If that
   * doesn't work for your usecase, consider interacting with the RPC manually, see JS tests of the
   * Solstory program for reference.
   */
  async deleteWriterMetadata(metadata: Metadata) {
    const metadataKey = await this.program.common.getWriterMetadataPda(this.writerKey);
    const solstoryPda = await this.program.common.getSolstoryPda();

    return this.program.rpc.deleteWriterMetadata({
      accounts: {
        writerProgram: this.writerKey,
        writerMetadataPda: metadataKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        solstoryPda: solstoryPda,
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
    const metadataKey = await this.program.common.getWriterMetadataPda(this.writerKey);

    return this.program.rpc.updateWriterMetadata(metadata, {
      accounts: {
        writerProgram: this.writerKey,
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
    const extMetadataKey = await this.program.common.getWriterExtendedMetadataPda(this.writerKey);
    const metadataKey = await this.program.common.getWriterMetadataPda(this.writerKey);

    return this.program.rpc.setExtendedMetadata(JSON.stringify(extMetadata), {
      accounts: {
        writerProgram: this.writerKey,
        writerMetadataPda: metadataKey,
        extendedMetadataPda: extMetadataKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  }


  /*
   * Use this to create an NFT head for your program. Remember to create
   *
   */
  async createWriterHead(mintId:PublicKey): Promise<string> {
    const writerHeadPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
    const metaplexPda = await MetaplexMetadata.getPDA(mintId);

    return this.program.rpc.createWriterHeadWriter({
      accounts: {
        writerProgram: this.writerKey,
        tokenMint: mintId,
        writerHeadPda: writerHeadPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplexPda,
      }
    });

  }

  async uploadItemBundlr(item:SolstoryItemContainer):Promise<string> {
    if(this.program.bundlr == undefined || !this.program.bundlrReady){
      return Promise.reject("bundlr not initialized");
    }
    const json = JSON.stringify(item);


    const price = await this.program.bundlr.getPrice((new TextEncoder().encode(json)).length);
    // Get your current balance
    const balance = await this.program.bundlr.getLoadedBalance();
    console.log("bundlr stuff", price.toString(), balance.toString());
    // If you don't have enough balance for the upload
    if (price > balance) {
        // integerValue(0) means round up
        const amount:number = price.minus(balance).multipliedBy(1.1).integerValue(0).toNumber()
        console.log("attempting to increase funding by", amount);
        // Fund your account with the difference
        // We multiply by 1.1 to make sure we don't run out of funds
        await this.program.bundlr.fund(amount);
    }

    // Create, sign and upload the transaction
    const transaction = this.program.bundlr.createTransaction(json);

    await transaction.sign();
    const id = transaction.id;
    console.log("pre upload");
    return transaction.upload().then((result)=>{
      console.log("bundlr output", id, result);
      return id;
    });

  }

  async appendItem(mintId: PublicKey, item:SolstoryItemInner){
    //get prev item
    const timestamp = Math.floor(Date.now()/1000)
    const dataHash = simpleHash(JSON.stringify(item));

    const headPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
    const headAct = await this.program.account.writerHead.fetch(headPda)
    const newHash = solstoryHash(timestamp, dataHash, headAct.currentHash)

    const fullItem:SolstoryItemContainer = {
      verified: {
        item: item,
        itemHash: dataHash,
        prevHash: headAct.currentHash,
        timestamp: timestamp,
      },
      hash: Buffer.from(newHash).toString('hex'),
      next: {
        uri: headAct.uuid,
      }
    };

    const url = await this.uploadItemBundlr(fullItem);
    const objId = ARWeave.utils.b64UrlToBuffer(url);

    return this.updateHeadAppend(mintId, fullItem, objId);


  }
  async updateHeadAppend(mintId:PublicKey, data: UpdateHeadData|SolstoryItemContainer, objId?:Uint8Array): Promise<string> {
      let cleanData:UpdateHeadData;

      // if objid is undefined, we assume it's a solstory item
      if ((data as UpdateHeadData).objId == undefined) {
          if(objId == undefined)
              throw Error('ID is required when data is a solstoryitem')

          const solItem = data as SolstoryItemContainer;
          cleanData = {
              timestamp: solItem.verified.timestamp,
              dataHash: Uint8Array.from(Buffer.from(solItem.verified.itemHash, 'hex')),
              prevHash: Uint8Array.from(Buffer.from(solItem.verified.prevHash, 'hex')),
              newHash: Uint8Array.from(Buffer.from(solItem.hash, 'hex')),
              objId: objId as Uint8Array,
          }
      } else {
        cleanData = data as UpdateHeadData;
      }

      const writerHeadPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
      return this.program.rpc.extAppend(cleanData, {
        accounts: {
          writerProgram: this.writerKey,
          tokenMint: mintId,
          writerHeadPda: writerHeadPda,
        },
      });
  }

  // async appendItemARDrive(mintId: PublicKey, data_obj: any): Promise<string> {
  // }

  // async appendItemURL(mintId: PublicKey, url: string): Promise<string> {

  // }






}

