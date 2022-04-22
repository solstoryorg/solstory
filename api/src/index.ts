/**
 * This is the entry point for using the solstory API. You should import the SolstoryAPI
 * as well as any types you need, then access individual modules with `solstoryAPI.<module>.`
 *
 * @module SolstoryAPI (start here)
 */
import * as utils from "./utils/index";
import { isBrowser, isNode } from "browser-or-node";
import { Program, Idl, Provider, Coder } from '@project-serum/anchor';
import { SolstoryClientAPI } from './client'
import { SolstoryServerAPI } from './server'
import { SolstoryCommonAPI } from './common'
import {
  SolstoryMetadata,
  SolstoryItemInner,
  SolstoryItemType,
  UpdateHeadData,
  SolstoryItemContainer,
  SolstoryHead,
  SolstoryStory
} from './common/types'
import { SOLSTORY_PUBKEY, BUNDLR_NODE_URL, BUNDLR_DEVNET_URL } from './constants'
import Bundlr, { WebBundlr } from '@bundlr-network/client';
// import * as fs from 'fs';

import * as solstoryIdl from './programs/solstory.json'
//this hack takes out the Module type which gets Typescript to stop complaining
const idl2 = JSON.parse(JSON.stringify(solstoryIdl));

// console.log(solstoryIdl)

/**
 * @param globalCdn This is the global cdn, which allows for the connecting of NFTs to Metadata/Stories.
 * @param cacheTimeout How long to cache metadata for before doing a refresh.
 * @param includeNonValidatedWriters Get metadata/heads even for writers that haven't been validated by Solstory. Use this for testing.
 */
export type SolstoryConfig = {
  globalCdn?: string,
  cacheTimeout?: number,
  includeNonValidatedWriters?: boolean,
}

type MetadataCache = {
  lastAll: number,
  metadata: {[writerKey: string]: SolstoryMetadata},
}

// export interface SolstoryAPI extends Program {
// }
/**
 * This is the api object. You can treat it just like a regular anchor program object,
 * but it has the additional "client" and "server" namespaces for common client and
 * server tasks.
 *
 * @noInheritDoc
 */
class SolstoryAPI extends Program<Idl> {
  public client: SolstoryClientAPI;
  public server: SolstoryServerAPI;
  public common: SolstoryCommonAPI;
  bundlr: Bundlr|WebBundlr|undefined;
  bundlrReady: boolean;
  globalCdn?: string;
  cacheTimeout: number; //in seconds;
  /** @internal */
  metadataCache: MetadataCache;
  /** @internal */
  includeNonValidatedWriters: boolean;

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

    // ({ globalCdn: this.globalCdn } = solstoryConfig);

    if(solstoryConfig.globalCdn) {
      this.globalCdn = solstoryConfig.globalCdn;
    } else {
      console.warn("Solstory is designed for use with a globalCdn. Use without a global CDN may result in a large number of RPC requests. There is a public global cdn available at cdn.solstory.is");
    }

    if(solstoryConfig.includeNonValidatedWriters)
      this.includeNonValidatedWriters = true;
    else
      this.includeNonValidatedWriters = false;

  }

  /**
   * @param fundingSecretKey node bundlr expects a string or uint8 of the secret key to use for funding. Please supply it here.
   * @param bundlrNetwork the bundlr network to connect to. supplying "devnet" or "mainnet" will automatically connect you to an appropriate bundlr node for those solana chains.
   * @param options: options for bundlr. include timeout, providerUrl to set rpc endpoint.
   */
  public configureBundlrServer(fundingSecretKey: Uint8Array|string, bundlrNetwork: string, options?: any) {
      if(!isNode) {
        console.warn("Unfamiliar environment, running as if it's node but behavior might not work as expected")
      }
      if(options == undefined)
        options = {};

      let bundlrOptions = options
      if(bundlrNetwork=="devnet"){
        bundlrNetwork = BUNDLR_DEVNET_URL;
        if(options.providerUrl == undefined){
          bundlrOptions.providerUrl = "https://api.devnet.solana.com";
        }
        // if someone passes in devnet and doesn't specify, we protect them by automatically
        // setting the correct RPC endpoint.
      }

      if(bundlrNetwork=="mainnet")
        bundlrNetwork = BUNDLR_NODE_URL;

      this.bundlr = new Bundlr(bundlrNetwork.toString(), "solana", fundingSecretKey, bundlrOptions);
      this.bundlrReady=true;
  }

  /**
   * @param signMessage bundlr needs to sign messages to validate client side transactions, the function to do this can be found in useWallet of the @solana-labs/wallet-adapter github repo.
   * @param sendTransaction bundlr needs to sendTransactions to validate client side transactions, the function to do this can be found in useWallet of the @solana-labs/wallet-adapter github repo.
   * @param bundlrNetwork the bundlr network to connect to. supplying "devnet" or "mainnet" will automatically connect you to an appropriate bundlr node for those solana chains.
   */

  public configureBundlrWeb(signMessage: (message: Uint8Array) => Promise<Uint8Array>,
                            sendTransaction:(transaction: any, connection: any, options?: any) => Promise<string>,
                            bundlrNetwork: string,
                            options: any={}) {
      if (!isBrowser){
        throw "Failed to detect browser environment, please use the other bundlr configuration function"
      }


      let bundlrOptions = options;

      // We automatically configure devnet bundlr to work with devnet solana.
      if(bundlrNetwork=="devnet"){
        bundlrNetwork = BUNDLR_DEVNET_URL;
        if(options.providerUrl == undefined){
          bundlrOptions.providerUrl = "https://api.devnet.solana.com";
        }
      }
      if(bundlrNetwork=="mainnet")
        bundlrNetwork = BUNDLR_NODE_URL;

      const bundlrobj = {
                                    signMessage: signMessage,
                                    sendTransaction: sendTransaction,
                                    ...(this.provider.wallet)
                                  };
      console.log("provobj", bundlrobj);
      console.log("bundlrurl", BUNDLR_NODE_URL);
      this.bundlr = new WebBundlr(BUNDLR_NODE_URL, "solana",
                                  bundlrobj, bundlrOptions);
      this.bundlr.ready().then(()=> {this.bundlrReady=true});
  }

}
export type { SolstoryItemInner, UpdateHeadData, SolstoryHead, SolstoryMetadata, SolstoryItemContainer, SolstoryStory } ;

export { SolstoryAPI, SolstoryItemType, utils }

