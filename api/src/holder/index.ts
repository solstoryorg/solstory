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
import { TOKEN_PROGRAM } from '../constants';
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

export class SolstoryHolderAPI {
  program: api.SolstoryAPI;
  holderKey: PublicKey;
  constructor(mainProgram: api.SolstoryAPI){
    this.program = mainProgram;
    this.holderKey = this.program.provider.wallet.publicKey;
  }


  /*
   * This updates the visibility index of a story.
   *
   * -1 will hide a story
   * values > 0 will force a story to appear
   * 0 will treat it as default
   *
   * @param index the visibility index to set this solstory to
   * @param tokenAcct optional param – this is an optimization that lets the api skip token act lookup if you already have it
   */
  async updateVisibility(writerKey:PublicKey, mintKey: PublicKey, index:number, tokenAcct?: PublicKey):Promise<string> {

    console.log("update: wk mk", writerKey.toBase58(), mintKey);
    const writerHeadPda = await this.program.common.getWriterHeadPda(writerKey, mintKey);

    if(tokenAcct == undefined) {
      const largestAccounts = await this.program.provider.connection.getTokenLargestAccounts(new PublicKey(mintKey));
      tokenAcct = largestAccounts.value[0].address;
    }

    const acts = {
      writerProgram: writerKey,
      tokenMint: mintKey,
      token: tokenAcct,
      writerHeadPda: writerHeadPda,
      holderKey: this.holderKey,
      tokenProgram: new PublicKey(TOKEN_PROGRAM),
    }

    console.log("updatevisib accounts", acts);
  const tx = this.program.rpc.updateVisibilityIndex(index,
  {
    accounts: acts,
  }
  );
  // console.dir(tx);
  return tx;


  }
}
