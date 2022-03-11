import { ProgramAccount, Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import axios from 'axios';
import * as api from '../';
import { Metadata, AccessType, VisibilityOverride, SolstoryHead, SolstoryItemContainer } from '../common/types'


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


  /**
   * This function will _assume_ a full refresh is desired, and will refresh
   * SolstoryAPI's internal cache of the metadata.k
   *
   *  @param cacheOverChain if this is true, we'll try to use the local cache instead
   *  of calling the blockhain
   */
  getAllMetadata(cacheOverChain=false): Promise<Metadata[]> {
    console.log("getallmetadata");
    // try cdn first
    if(this.program.globalCdn){
      // web request here
      return axios.get(this.program.globalCdn+'/metadata/all')
        .then((res) => {
          console.log(res);
          //here we insert them into the cache.
          return []
        });
    }

    if  (cacheOverChain && Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll ){
      return Promise.resolve(Object.values(this.program.metadataCache.metadata));
    }

    // failing that use
    return this.program.account.writerMetadata.all().
      then((accts:ProgramAccount[]) => {
      const outMetadata: Metadata[] = []
      console.log("raw metadata on chain result", accts);
      accts.forEach((acct, index) =>{
        let metadata:Metadata = {...(acct.account)};

        this.program.metadataCache.metadata[acct.account.writerKey.toString()] = metadata
        outMetadata.push(metadata);
      });
      this.program.metadataCache.lastAll = Date.now();

      return outMetadata;
    })
  }

  getHeadsForNFT(nft:any): Promise<SolstoryHead[]> {
    // check for cache expiration
    if  (Date.now()-(1000*this.program.cacheTimeout) > this.program.metadataCache.lastAll ){
      //this will refresh the cache
      this.getAllMetadata();

    }

    // generate head pdas from metadata + nft mint token
    // lookup all head PDAs in a mass call

    return Promise.resolve([]);
  }

  // getAllMetadataChain(): Promise

  // getAllMetadataCDN()


}

/**
 * getStories takes in a key a mint, and gets all the metadatas attached.
 * Option for returning metadatas that aren't official or don't have approval
 *
 */
// export function getMoments(headPubkey:PublicKey, pageSize:number, page:number) : Promise<Stories>{

// }



// getMomentsUntil

// {
//   moments []

//   next {
//     id
//     url
//   }
// }

// getMomentsFromStart

