import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';


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

type Metadata = any;

// an api client is a stateful container of a few things
// first it contains global state like the global cdn and the RPC address that the client
// should connect itself too.

//   Second it handles memoization of outputs.

export class SolstoryClientAPI {
  program: Program;
  constructor(anchorProgram: Program){
    this.program = anchorProgram;
  }

  getAllMetadata(): Promise<Metadata[]> {
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

