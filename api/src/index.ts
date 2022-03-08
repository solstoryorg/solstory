import * as utils from "./utils/index";
import { isBrowser, isNode } from "browser-or-node";
import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import { SolstoryClientAPI } from './client'
import { SolstoryServerAPI } from './server'
import { SolstoryCommonAPI } from './common'
import { Metadata, AccessType, VisibilityOverride, SolstoryHead, SolstoryItem } from './common/types'
import { SOLSTORY_PUBKEY, BUNDLR_NODE_URL } from './constants'
import Bundlr, { WebBundlr } from '@bundlr-network/client';
// import * as fs from 'fs';

import * as solstoryIdl from './programs/solstory.json'
//this hack takes out the Module type which gets Typescript to stop complaining
const idl2 = JSON.parse(JSON.stringify(solstoryIdl));

// console.log(solstoryIdl)

/**
 * @param globalCdn This is the global cdn, which allows for the connecting of NFTs to Metadata/Stories.
 */
type SolstoryConfig = {
  globalCdn?: string,
  cacheTimeout?: number,
}

type MetadataCache = {
  lastAll: number,
  metadata: {[writerKey: string]: Metadata},
}

// export interface SolstoryAPI extends Program {
// }
/**
 * This is the api object. You can treat it just like a regular anchor program object,
 * but it has the additional "client" and "server" namespaces for common client and
 * server tasks.
 *
 */
export class SolstoryAPI extends Program<Idl> {
  client: SolstoryClientAPI;
  server: SolstoryServerAPI;
  common: SolstoryCommonAPI;
  bundlr: Bundlr|WebBundlr|undefined;
  bundlrReady: boolean;
  globalCdn?: string;
  cacheTimeout: number; //in seconds;
  metadataCache: MetadataCache;

  constructor(solstoryConfig: SolstoryConfig, provider?: Provider, coder?: Coder){
    provider?.wallet;
    super(idl2.default, SOLSTORY_PUBKEY, provider, coder);
    this.metadataCache = {
      lastAll: 0,
      metadata: {}

    }

    this.client = new SolstoryClientAPI(this);
    this.server = new SolstoryServerAPI(this);
    this.common = new SolstoryCommonAPI(this);

    this.bundlrReady=false;


    this.cacheTimeout = 0;
    if (solstoryConfig.cacheTimeout) {
      this.cacheTimeout = solstoryConfig.cacheTimeout;
    }


    ({ globalCdn: this.globalCdn } = solstoryConfig);

    if(solstoryConfig.globalCdn) {
      this.globalCdn = solstoryConfig.globalCdn;
    }
  }

  //node bundlr expects a string or uint8 of the secret key
  public configureBundlrServer(secretKey: Uint8Array|string) {
      if(!isNode) {
        console.warn("Unfamiliar environment, running as if it's node but behavior might not work as expected")
      }

      this.bundlr = new Bundlr(BUNDLR_NODE_URL, "solana", secretKey);
      this.bundlrReady=true;
  }

  public configureBundlrWeb(signMessage: (message: Uint8Array) => Promise<Uint8Array>, sendTransaction:(transaction: any, connection: any, options?: any) => Promise<string>) {
      if (!isBrowser){
        throw "Failed to detect browser environment, please use the other bundlr configuration function"
      }
      const bundlrobj = {
                                    signMessage: signMessage,
                                    sendTransaction: sendTransaction,
                                    ...(this.provider.wallet)
                                  };
      console.log("provobj", bundlrobj);
      console.log("bundlrurl", BUNDLR_NODE_URL);
      this.bundlr = new WebBundlr(BUNDLR_NODE_URL, "solana",
                                  bundlrobj);
      this.bundlr.ready().then(()=> {this.bundlrReady=true});
  }

}
export type { SolstoryItem, } ;

export default { SolstoryAPI, utils }

