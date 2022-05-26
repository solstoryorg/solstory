/**
 * This is the entry point for using the solstory API. You should import the SolstoryAPI
 * as well as any types you need, then access individual modules with `solstoryAPI.<module>.`
 *
 * @module SolstoryAPI (start here)
 */
import * as utils from "./utils/index";
import { isBrowser, isNode } from "browser-or-node";
import { Program, Idl, Provider, Coder } from '@project-serum/anchor';
import { SolstoryWriterAPI, SolstoryAppendItemOptions } from './writer'
import { SolstoryCreatorAPI } from './creator'
import { SolstoryHolderAPI } from './holder'
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
 * It has different namespaces depending on which entity's permissions are required,
 * and will natively treat the public key Solstory was initialized with as the
 * key of that entity for the sake of signing (since it's currently not
 * practical to sign with multiple keys in an api that's supposed to work on both
 * clients AND servers).
 *
 * - *holder* contains actions permissible to the holder of the nft
 * - *writer* contains actions permissible to writer program key
 * - *creator* contains actions permissible to the creator of the nft
 * - *common* contains actions common actions that do not require signing, like lookups
 *
 * @noInheritDoc
 */
class SolstoryAPI extends Program<Idl> {
  public holder: SolstoryHolderAPI;
  public writer: SolstoryWriterAPI;
  public creator: SolstoryCreatorAPI;
  public common: SolstoryCommonAPI;
  bundlr: Bundlr|WebBundlr|undefined;
  bundlrReady: boolean;
  bundlrFundingRatio?: number;
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

    this.holder = new SolstoryHolderAPI(this);
    this.common = new SolstoryCommonAPI(this);
    this.writer = new SolstoryWriterAPI(this);
    this.creator = new SolstoryCreatorAPI(this);

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
   * @param bundlrFundingRatio must be at least 1. Bundlr is funded off of an account kept by them. When current funding is insufficient for an upload, solstory will calculate how much the current item costs and add that amount, multiplied by the bundlrFundingRatio, to the account. This takes a full solana transaction confirmation, so selecting a higher ratio will allow you to amortize this cost over a larger number of transaction. For example, a ratio of 100 will allow for effectively 1.01 solana transactions for upload instead of a 2 solana transactions (one for the bundlr fee, one for the solstory stuff) per upload. Use cases with inconsistent or possibly unbounded item sizes may wish instead to manually prefund and set this ratio to something low, like 1.1.
   */
  public configureBundlrServer(fundingSecretKey: Uint8Array|string, bundlrNetwork: string, bundlrFundingRatio: number=1.1, options: any={}) {
      if(!isNode) {
        console.warn("Unfamiliar environment, running as if it's node but behavior might not work as expected")
      }

      this.bundlrFundingRatio = bundlrFundingRatio;

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
   * @param bundlrFundingRatio must be at least 1. Bundlr is funded off of an account kept by them. When current funding is insufficient for an upload, solstory will calculate how much the current item costs and add that amount, multiplied by the bundlrFundingRatio, to the account. This takes a full solana transaction confirmation, so selecting a higher ratio will allow you to amortize this cost over a larger number of transaction. For example, a ratio of 100 will allow for effectively 1.01 solana transactions for upload instead of a 2 solana transactions (one for the bundlr fee, one for the solstory stuff) per upload. Use cases with inconsistent or possibly unbounded item sizes may wish instead to manually prefund and set this ratio to something low, like 1.1.
   */

  public configureBundlrWeb(signMessage: (message: Uint8Array) => Promise<Uint8Array>,
                            sendTransaction:(transaction: any, connection: any, options?: any) => Promise<string>,
                            bundlrNetwork: string,
                            bundlrFundingRatio: number=1.1,
                            options: any={}) {
      if (!isBrowser){
        throw "Failed to detect browser environment, please use the other bundlr configuration function"
      }

      this.bundlrFundingRatio = bundlrFundingRatio;

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
export type { SolstoryItemInner, UpdateHeadData, SolstoryHead, SolstoryMetadata, SolstoryItemContainer, SolstoryStory, SolstoryAppendItemOptions } ;

export { SolstoryAPI, SolstoryItemType, utils }

