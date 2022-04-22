import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import type { web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import * as api from '../';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { SolstoryMetadata,
  UpdateHeadData,
  SolstoryItemContainer,
  SolstoryItemInner,
  SolstoryItemType,
  AccessType,
  AccessTypeIndex
} from '../common/types';
import { solstoryItemInnerToString } from '../common/conversions'
import { simpleHash, solstoryHash } from '../utils';
import { Metadata as MetaplexMetadata } from "@metaplex-foundation/mpl-token-metadata";
import ARWeave from 'arweave';

module SolstoryServerWriterAPI {
  export type SolstoryApprendItemOptions = {
    confirmation: web3.ConfirmOptions,
  }
}
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
  async createWriterMetadata(metadata: SolstoryMetadata) {
    const metadataKey = await this.program.common.getWriterMetadataPda(this.writerKey);
    const solstoryPda = await this.program.common.getSolstoryPda();

    return this.program.rpc.createWriterMetadata(metadata, {
      accounts: {
        writerProgram: this.writerKey,
        writerMetadataPda: metadataKey,
        solstoryPda: solstoryPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      options: {
        commitment: "confirmed" as web3.Commitment,
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
  async deleteWriterMetadata(metadata: SolstoryMetadata) {
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
  async updateWriterMetadata(metadata: SolstoryMetadata) {
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

        //@ts-ignore "finalized" is in commitment
    return this.program.rpc.createWriterHeadWriter({
      accounts: {
        writerProgram: this.writerKey,
        tokenMint: mintId,
        writerHeadPda: writerHeadPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplexPda,
      },
      options: {
        commitment: 'finalized',
      }
    });

  }

  /**
   * Returns price of an upload to bundlr
   *
   */
  async bundlrPriceCheck(item:SolstoryItemContainer):Promise<number> {
    if(this.program.bundlr == undefined || !this.program.bundlrReady){
      return Promise.reject("bundlr not initialized");
    }
    const json = JSON.stringify(item);

    return this.program.bundlr.getPrice((new TextEncoder().encode(json)).length).then((bn)=>bn.toNumber());

  }
  /**
   * Uploads an item to bundlr.
   *
   * If you want to misuse the library, pass anything you want in and it'll get serialized
   * to json. Or just copy this implementation of bundlr uploading for your own purposes.
   *
   * This will naturally fail if bundlr has not been initialized.
   *
   * WARNING: This function will also cost sol on either devnet or mainnet. Uploads to
   * bundlr are relatively cheap but _are NOT_ free. Call this.bundlr.getPrice with the
   * bytes in your data to get a price check.
   *
   * @param item a solstory item that gets turned into JSON then uploaded.
   */
  async uploadItemBundlr(item:SolstoryItemContainer):Promise<string> {
    if(this.program.bundlr == undefined || !this.program.bundlrReady){
      return Promise.reject("bundlr not initialized");
    }
    const json = JSON.stringify(item);

    const price = await this.program.bundlr.getPrice((new TextEncoder().encode(json)).length);
    // Get your current balance
    const balance = await this.program.bundlr.getLoadedBalance();
    if (price.isGreaterThan(balance)) {
        // integerValue(0) means round up
        const amount:number = price.minus(balance).multipliedBy(1.1).integerValue(0).toNumber()
        console.log("attempting to increase funding by", amount);
        // Fund your account with the difference
        // We multiply by 1.1 to make sure we don't run out of funds
        await this.program.bundlr.fund(amount);
    }

    console.log("funded")
    // Create, sign and upload the transaction
    const transaction = this.program.bundlr.createTransaction(json);
    console.log("bunldr transaction", transaction);

    await transaction.sign();
    const id = transaction.id;
    console.log("pre upload");
    return transaction.upload().then((result)=>{
      console.log("bundlr output", id, result);
      return id;
    });

  }

  /**
   * Takes a brand new solstory item and converts it to the update data needed to update
   * the head stored on the solana blockchain.
   */
  solstoryItemToUpdateHeadData(solItem: SolstoryItemContainer, objId:Uint8Array, accessType:AccessType): UpdateHeadData{
      const cleanData = {
          timestamp: new anchor.BN(solItem.verified.timestamp),
          dataHash: Uint8Array.from(Buffer.from(solItem.verified.itemHash, 'hex')),
          currentHash: Uint8Array.from(Buffer.from(solItem.verified.nextHash, 'hex')),
          newHash: Uint8Array.from(Buffer.from(solItem.hash, 'hex')),
          objId: objId as Uint8Array,
          accessType: accessType
      }

      return cleanData

  }

  /**
   * Appends an item to the initialized writer+mintId solstory sidechain.
   *
   * This method transparently uses ARBundler for high efficiency uploading.
   *
   * skipInitHeadCheck will crash instead of creating a missing head account. This is useful
   * because creating a head costs a (small) amount of sol, which a service might not want
   * to do automatically at its own expense.
   *
   * Heads can be created manually by both the writer service (the one calling appendItem)
   * or by the update-privilege-owner of the NFT, since it is a modification on the NFT.
   */
  async appendItem(mintId: PublicKey, item:SolstoryItemInner, options: SolstoryServerWriterAPI.SolstoryApprendItemOptions = {confirmation:{}}){
    //get prev item
    const timestamp = Math.floor(Date.now()/1000)
    const rawItem = solstoryItemInnerToString(item);
    const dataHash = simpleHash(rawItem);

    const headPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
    let headAct;
    // This will error if head is missing, which we want since this isn't appendItemCreate
    headAct = await this.program.account.writerHead.fetch(headPda)
    const newHash = solstoryHash(timestamp, dataHash, headAct.currentHash)

    const fullItem:SolstoryItemContainer = {
      verified: {
        itemRaw: rawItem,
        item: item,
        itemHash: dataHash,
        nextHash: headAct.currentHash,
        timestamp: timestamp,
      },
      hash: Buffer.from(newHash).toString('hex'),
      next: {
        objId: headAct.objId,
        accessType: headAct.accessType,
      }
    };

    const url = await this.uploadItemBundlr(fullItem);
    const objId = ARWeave.utils.b64UrlToBuffer(url);

    const headUpdate = this.solstoryItemToUpdateHeadData(fullItem, objId, AccessTypeIndex.ArDrive);


    return this.updateHeadAppend(mintId, headUpdate, options.confirmation);


  }

  /**
   * Appends an item to the initialized writer+mintId solstory sidechain.
   *
   * This method transparently uses ARBundler for high efficiency uploading.
   *
   * skipInitHeadCheck will crash instead of creating a missing head account. This is useful
   * because creating a head costs a (small) amount of sol, which a service might not want
   * to do automatically at its own expense.
   *
   * Heads can be created manually by both the writer service (the one calling appendItem)
   * or by the update-privilege-owner of the NFT, since it is a modification on the NFT.
   */
  async appendItemCreate(mintId: PublicKey, item:SolstoryItemInner, options: SolstoryServerWriterAPI.SolstoryApprendItemOptions = {confirmation:{}}){
    //get prev item
    const timestamp = Math.floor(Date.now()/1000)
    const rawItem = solstoryItemInnerToString(item);
    const dataHash = simpleHash(rawItem);

    const headPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
    let headAct;
    let accounts;
    let create = false;
    try {
      headAct = await this.program.account.writerHead.fetch(headPda)
    }catch(err:any) {
      // Creating a head costs sol, so we give the option to disable it.
      if(err.message.startsWith("Account does not exist")){
        console.log("head is missing, creating it.")

        const writerHeadPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
        const metaplexPda = await MetaplexMetadata.getPDA(mintId);

        accounts = {
            writerProgram: this.writerKey,
            tokenMint: mintId,
            writerHeadPda: writerHeadPda,
            systemProgram: anchor.web3.SystemProgram.programId,
            metaplexMetadataPda: metaplexPda,
          };
        create = true;

        headAct = {
          currentHash: new Uint8Array(32).fill(0),
          objId: new Uint8Array(32).fill(0),
          accessType: {none:{}}
        };
      }else{
        throw err;
      }
    }
    const newHash = solstoryHash(timestamp, dataHash, headAct.currentHash)

    const fullItem:SolstoryItemContainer = {
      verified: {
        itemRaw: rawItem,
        item: item,
        itemHash: dataHash,
        nextHash: headAct.currentHash,
        timestamp: timestamp,
      },
      hash: Buffer.from(newHash).toString('hex'),
      next: {
        objId: headAct.objId,
        accessType: headAct.accessType,
      }
    };

    const url = await this.uploadItemBundlr(fullItem);
    const objId = ARWeave.utils.b64UrlToBuffer(url);

    const headUpdate = this.solstoryItemToUpdateHeadData(fullItem, objId, AccessTypeIndex.ArDrive);


    if(!create)
      return this.updateHeadAppend(mintId, headUpdate);

    return this.program.rpc.createAndAppend(headUpdate,
          {
            accounts: accounts,
            options: options.confirmation,
          });


  }
  /**
   * Wrapper function around the external append RPC call.
   */
  async updateHeadAppend(mintId:PublicKey, data: UpdateHeadData, options: web3.ConfirmOptions={}): Promise<string> {

      console.log("clean data:", data);
      const writerHeadPda = await this.program.common.getWriterHeadPda(this.writerKey, mintId);
      return this.program.rpc.extAppend(data, {
        accounts: {
          writerProgram: this.writerKey,
          tokenMint: mintId,
          writerHeadPda: writerHeadPda,
        },
        options: options,
      });
  }

  // async appendItemARDrive(mintId: PublicKey, data_obj: any): Promise<string> {
  // }

  // async appendItemURL(mintId: PublicKey, url: string): Promise<string> {

  // }






}

