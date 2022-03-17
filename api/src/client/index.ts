/**
 * This is the client API, it deals with things like getting stories
 * and showing/hiding stories, basically anything you would do as the user
 * who owns a certain NFT.
 */
import { ProgramAccount, Program, BN, IdlAccounts, Idl, Address, Provider, Coder, web3 } from '@project-serum/anchor';
import axios from 'axios';
import bs58 from 'bs58';
import { getRetriever, simpleHash, solstoryHash } from '../utils'
import * as api from '../';
import { SolstoryMetadata,
  AccessType,
  VisibilityOverride,
  SolstoryHead,
  SolstoryItemContainer,
  SolstoryStory,
} from '../common/types';
import { solstoryMetadataFromString,
  solstoryHeadFromString,
  solstoryStoryFromString,
} from '../common/conversions';
import { PublicKey } from '@solana/web3.js';




// an api client is a stateful container of a few things
// first it contains global state like the global cdn and the RPC address that the client
// should connect itself too.

//   Second it handles memoization of outputs.

export class SolstoryClientAPI {
  program: api.SolstoryAPI;
  constructor(mainProgram: api.SolstoryAPI){
    this.program = mainProgram;
  }


  getMetadata(writerKey:PublicKey, allowCachedMetadata: boolean=false):Promise<SolstoryMetadata> {
    if (allowCachedMetadata && writerKey.toBase58() in this.program.metadataCache.metadata &&
              (Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll)){
      return Promise.resolve(this.program.metadataCache.metadata[writerKey.toBase58()]);
    }
    if(this.program.globalCdn) {
        return axios.get(this.program.globalCdn+'/metadata/'+writerKey.toBase58()).then((res) =>{

          console.log("single metadata", res);

          return solstoryMetadataFromString(res.data);
        });
    }

    return this.program.common.getWriterMetadataPda(writerKey).then((pdaKey)=> {
      return this.program.account.WriterMetadata.fetch(pdaKey).then((meta) => {
        console.log("meta from the chain", meta);
        return meta as SolstoryMetadata;
      });
    });
  }

  /**
   * This function will _assume_ a full refresh is desired, and will refresh
   * SolstoryAPI's internal cache of the metadata.k
   *
   * This will default to only getting validated metadata, meaning metadata approved by the system.
   * If you'd like to get even non-validated accounts, initiate the API with the
   * "getNonValidatedWriters" option set to true.
   *
   *  @param cacheOverChain if this is true, we'll try to use the local cache instead
   *  of calling the blockhain. Setting this to true means getAllMetadata might return
   *  stale data.
   */
  getAllMetadata(cacheOverChain=false): Promise<SolstoryMetadata[]> {
    console.log("getallmetadata");
    // try cdn first
    if(this.program.globalCdn){
      // web request here
      return axios.get(this.program.globalCdn+'/metadata/all')
        .then((res) => {
          console.log(res);
          //here we insert them into the cache.
          //
          //
          this.program.metadataCache.lastAll = Date.now()
          return []
        });
    }

    if  (cacheOverChain && Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll ){
      return Promise.resolve(Object.values(this.program.metadataCache.metadata));
    }

    // failing that use the blockchain
    let filter = [{memcmp: {
        offset: 32, // public key then validation byte.
        bytes: bs58.encode(Uint8Array.from([1])), //true
      }}]
    if(this.program.getNonValidatedWriters)
      filter = [];

    return this.program.account.writerMetadata.all(
      filter).
    // ).
      then((accts:ProgramAccount[]) => {
      const outMetadata: SolstoryMetadata[] = []
      console.log("raw metadata on chain result", accts);

      //clean out old metadata
      this.program.metadataCache.metadata = {};
      this.program.metadataCache.lastAll = 0;

      accts.forEach((acct, index) =>{
        let metadata:SolstoryMetadata = {...(acct.account)};

        this.program.metadataCache.metadata[acct.account.writerKey.toBase58()] = metadata
        outMetadata.push(metadata);
      });
      this.program.metadataCache.lastAll = Date.now();

      return outMetadata;
    })
  }

  public async getHead(writerKey:PublicKey, mintKey:PublicKey): Promise<SolstoryHead>{
    if(this.program.globalCdn) {
        return axios.get(this.program.globalCdn+'/metadata/'+writerKey.toBase58()).then((res) =>{

          console.log("single metadata", res);

          return solstoryHeadFromString(res.data);
        });
    }
    let metadata:SolstoryMetadata;
    // we won't get the metadata if we pull from the blockchain, so use cache if available
    if  (Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll )
      metadata = this.program.metadataCache.metadata[writerKey.toBase58()];
    else
      metadata = await this.getMetadata(writerKey);

    return this.program.common.getWriterHeadPda(writerKey, mintKey).then((pdaKey)=> {
      return this.program.account.WriterHead.fetch(pdaKey).then((rawHead) => {
        const head: SolstoryHead = rawHead as SolstoryHead;

        const solHead:SolstoryHead = {...(head)};
        solHead.metadata = metadata;
        console.log("solstoryhead", solHead);
        return solHead;
      });
    });

  }

  /**
   * This will retrieve all metadatas, then find all the ones that have a connection
   * with the given NFT.
   *
   * Just like the getAllMetadata this will default to only getting validated metadata.
   * If you'd like to get even non-validated accounts, initiate the API with the
   * "getNonValidatedWriters" option set to true.
   *
   * @param showInvisible Stories can mark themselves as "invisible" when they are used for system
   * things. For example, a serverless NFT game might store game data intended for use by the system,
   * in which case it signal that this story wasn't for human consumption by marking "invisible" as true. Setting this flag will load the data anyway (useful for debugging or curiosity).
   *
   */
  public async getHeadsForNFT(mintKey: PublicKey, showInvisible:boolean=false, forceRefreshMetadata:boolean=false): Promise<SolstoryHead[]> {
    if(this.program.globalCdn){
      // web request here
      return axios.get(this.program.globalCdn+'/nft/'+mintKey.toBase58())
        .then((res) => {
          console.log("from cdn", res);
          return []
        });
    }

    console.warn("Currently fetching writers for NFT without a global CDN, this is expensive and liable to overloading RPC endpoint API limits.");
    console.warn("TESTING23");

    // check for cache expiration
    if  (forceRefreshMetadata || Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll ){
      //this will refresh the cache
      console.log("refreshing the metadata cache");
      this.getAllMetadata();
    }

    // generate head pdas from metadata + nft mint token
    // lookup all head PDAs in a mass call
    const pdaPromises:Promise<{pda:PublicKey, wk:string}>[] = [];

    console.log(this.program.metadataCache);
    //iterate through all metadata and create teh PDA address.
    for(let writerKey in this.program.metadataCache.metadata) {
      console.log("checking writer key", writerKey);
      const metadata = this.program.metadataCache.metadata[writerKey];
      // skip if the metadata marks itself as not user visible
      if (!showInvisible && !metadata.visible)
        continue;
      pdaPromises.push(this.program.common.getWriterHeadPda(writerKey, mintKey).then((pk) => {
        return {'pda':pk, 'wk':writerKey};
      }));
    }

    //small micro optimization
    return Promise.all(pdaPromises).then((headPdaPubkeyObjects: {pda:PublicKey, wk:string}[]) => {
    // return Promise.all(pdaPromises).then((headPdaPubkeys: PublicKey[]) => {

      const fetchPromises:Promise<SolstoryHead[]>[] = [];

      // cut into slices of 100 and then create SolstoryHead items
      for(let i=0; i<headPdaPubkeyObjects.length; i+=100) {
        const objectsSlice = headPdaPubkeyObjects.slice(i, i+100);
        const pdaSlice = objectsSlice.map((pair)=>{return pair.pda});
        fetchPromises.push(this.program.account.writerHead.fetchMultiple(pdaSlice).then((accts) => {
          console.log("fetch head pdas out", accts);
          const outs:SolstoryHead[] = []
          accts.map((acctObj, index) => {
            // null means the account was not found (and doesn't exist)
            if(acctObj == null)
              return;
            //This will not have metadata, but will have the other properties
            const acct = acctObj as SolstoryHead;
            // create a SolstoryHead and append it to the output
            outs.push({
              metadata: this.program.metadataCache.metadata[objectsSlice[index].wk],

              writerKey: pdaSlice[i],
              mintKey: mintKey,
              objId: acct.objId,
              authorized: acct.authorized,
              visibilityIndex: acct.visibilityIndex,
              currentHash: Buffer.from(acct.currentHash).toString('hex'),
              accessType: acct.accessType,
            });
          });
          return outs;
        }));
      }


      //Unwind all the fetches.
      return Promise.all(fetchPromises).then((dblArr) => {
        const outs:SolstoryHead[] = []
        dblArr.map((arr) => {
          outs.push(...arr);
        });
        return outs;
      });
    });
  }


  /**
    * If a CDN is not used, getStory will require <initialItems> serial web requests.
    * One way to get around this and do progressive loading, is to request 1 item and then
    * repeatedly call getAdditionalItems.
    */
  async getStory(writerKey: PublicKey, mintKey:PublicKey, initialItems:number=10): Promise<SolstoryStory> {

    return this.getHead(writerKey, mintKey).then((head) => {
      return this.getStoryFromHead(head, initialItems);

    });
  }



  /**
    * Takes a SolstoryHead describing a particular story and returns the actual items in thats
    * story.
    *
    * @returns A SolstoryStory with the *up to* the requested number of items loaded.
    *
    * Performance characteristics:
    *
    * If a CDN is not used, getStoryFromWriter will require <initialItems> serial web requests.
    * One way to get around this and do progressive loading, is to request 1 item and then
    * call getAdditionalItems, which will progressively add as many items as requested to
    * the now initialized SolstoryStory.
    */
  public getStoryFromHead(writer: SolstoryHead, initialItems:number):Promise<SolstoryStory> {
    // return this.getStory(writer.metadata.writerKey, writer.mintKey, initialItems)
    if(this.program.globalCdn && writer.metadata && writer.metadata.cdn) {
      return axios.get(writer.metadata.cdn+'/nft/', {
                       params: {
                         mintKey: writer.mintKey.toBase58(),
                         count: initialItems,
                       }

      }).then((resp) => {
          console.log(resp);
          return solstoryStoryFromString(resp.data);
      });
    }

    const story: SolstoryStory = {
      metadata: writer.metadata,
      mintKey: writer.mintKey,
      headHash: writer.currentHash,
      items: [],
      next: {
        objId: writer.objId,
        accessType: writer.accessType,
      }
    };

    return this.getAdditionalItems(story, initialItems)
  }




  /**
   * This appends additional items to the story, and resolves the promise with the same story
   * when the additions are done.
   */
  getAdditionalItems(story: SolstoryStory, numItems:number): Promise<SolstoryStory> {
    //Hit up the CDN here
    if (story.metadata.cdn){
      return axios.get(story.metadata.cdn+'/nft/', {
                       params: {
                         mintKey: story.mintKey.toBase58(),
                         count: numItems,
                         cursor: story.next.cdnCursor
                       }
      }).then((resp) => {
          console.log(resp);
          return solstoryStoryFromString(resp.data);
      });

    }
    const accessType:string = Object.keys(story.next.accessType)[0]
    let retriever:(baseUrl:string, objId:Uint8Array) => Promise<SolstoryItemContainer>;
    retriever = getRetriever(accessType);

    return retriever(story.metadata.baseUrl, story.next.objId).then((itemContainer) => {
      // Hexed obj ids used to do matching for "ref" field.
      itemContainer.objId = Buffer.from(story.next.objId).toString('hex');
      itemContainer.verifiedSuccess = story.items[-1].verified && this.verifyItem(story.items[-1].verified.nextHash, itemContainer.verified);
      story.items.push(itemContainer);
      story.next = itemContainer.next;

      // The 0,0,0... id represents the end of the hashlist, congrats!
      if (numItems > 1 && (story.next.objId.toString() != '0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0'))
        return this.getAdditionalItems(story, numItems-1);
      return story;
    });
  }

  /**
    * @internal
    *
    * If you intend to use this function, please see how it works in {@link getAdditionalItems}.
    */
  verifyItem(currentHash:string, verified: {itemRaw: string, itemHash:string, nextHash: string, timestamp:number}): boolean {
    return simpleHash(verified.itemRaw) == verified.itemHash &&
      Buffer.from(solstoryHash(verified.timestamp, verified.itemHash, verified.nextHash)).toString('hex') == currentHash;

  }
}
