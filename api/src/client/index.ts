import { ProgramAccount, Program, BN, IdlAccounts, Idl, Address, Provider, Coder, web3 } from '@project-serum/anchor';
import axios from 'axios';
import bs58 from 'bs58';
import { getRetriever } from '../utils'
import * as api from '../';
import { SolstoryMetadata,
  AccessType,
  VisibilityOverride,
  SolstoryHead,
  SolstoryItemContainer,
  SolstoryStory,
  solstoryMetadataFromString,
  solstoryHeadFromString,
  solstoryStoryFromString,
} from '../common/types'
import { PublicKey } from '@solana/web3.js';


/**
 * This is the client API, it deals with things like getting stories
 * and showing/hiding stories, basically anything you would do as the user
 * who owns a certain NFT.
 **/

/**
 * @property initialLoad
 */
type getStoriesConfig = {
  initialLoad?: number,
  allowCDN?: boolean,
  pageSize?: 20,
}

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
   *  @param cacheOverChain if this is true, we'll try to use the local cache instead
   *  of calling the blockhain
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

    // failing that use
    return this.program.account.writerMetadata.all(
      [{memcmp: {
        offset: 32, // public key then validation byte.
        bytes: bs58.encode(Uint8Array.from([1])), //true
      }}]).
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
   */
  public async getAllHeadsForNFT(mintKey: PublicKey, showInvisible:boolean=false, forceRefreshMetadata:boolean=false): Promise<SolstoryHead[]> {
    if(this.program.globalCdn){
      // web request here
      return axios.get(this.program.globalCdn+'/nft/'+mintKey.toBase58())
        .then((res) => {
          console.log(res);
          return []
        });
    }

    console.warn("Currently fetching writers for NFT without a global CDN, this is expensive and liable to overloading RPC endpoint API limits.");

    // check for cache expiration
    if  (forceRefreshMetadata || Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll ){
      //this will refresh the cache
      this.getAllMetadata();
    }

    // generate head pdas from metadata + nft mint token
    // lookup all head PDAs in a mass call
    let headPdaPubkeys:PublicKey[] = [];
    const pdaPromises:Promise<PublicKey>[] = [];

    //iterate through all metadata and create teh PDA address.
    for(let writerKey in this.program.metadataCache.metadata) {
      const metadata = this.program.metadataCache[writerKey];
      // skip if the metadata marks itself as not user visible
      if (!showInvisible && !metadata.visible)
        continue;
      pdaPromises.push(this.program.common.getWriterHeadPda(writerKey, mintKey).then((pk) => {
        return pk;
      }));
    }

    //small micro optimization
    return Promise.all(pdaPromises).then((headPdaPubkeys: PublicKey[]) => {
    // return Promise.all(pdaPromises).then((headPdaPubkeys: PublicKey[]) => {

      const fetchPromises:Promise<SolstoryHead[]>[] = [];

      // cut into slices of 100 and then create SolstoryHead items
      for(let i=0; i<headPdaPubkeys.length; i+=100) {
        const pdaSlice = headPdaPubkeys.slice(i, i+100);
        fetchPromises.push(this.program.account.WriterHead.fetchMultiple(pdaSlice).then((accts) => {
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
              metadata: this.program.metadataCache.metadata[pdaSlice[i].toBase58()],

              writerKey: pdaSlice[i],
              mintKey: mintKey,
              objId: acct.objId,
              authorized: acct.authorized,
              visibilityIndex: acct.visibilityIndex,
              dataHash: acct.dataHash,
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
      return this.getSolstoryStoryFromHead(head, initialItems);

    });
  }



  /**
    * If a CDN is not used, getStoryFromWriter will require <initialItems> serial web requests.
    * One way to get around this and do progressive loading, is to request 1 item and then
    * repeatedly call getAdditionalItems.
    */
  public getSolstoryStoryFromHead(writer: SolstoryHead, initialItems:number):Promise<SolstoryStory> {
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
      items: [],
      next: {
        objId: writer.objId,
        accessType: writer.accessType,
      }
    };

    return this.getAdditionalItems(story, initialItems)
  }




  /**
   * If a solstory story is passed in, it will be modified in place.
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
      story.items.push(itemContainer);
      story.next = itemContainer.next;

      if (numItems > 1)
        return this.getAdditionalItems(story, numItems-1);
      return story;
    });
  }

}
