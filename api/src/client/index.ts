import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import axios from 'axios';
import * as api from '../';
import { Metadata, AccessType, VisibilityOverride, Head, Item } from '../common/types'


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
   */

  getAllMetadata(): Promise<Metadata[]> {
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


    // failing that use
    return this.program.account.Metadata.all().
      then((accts:any) => {
      return accts;
    })

    // then(data=>

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

