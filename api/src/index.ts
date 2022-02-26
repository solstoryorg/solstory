export * as utils from "./utils/index";
import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import { SolstoryClientAPI } from './client'
import { SolstoryServerAPI } from './server'
import { SolstoryCommonAPI } from './common'
import { Metadata, AccessType, VisibilityOverride, Head, Item } from './common/types'
// import * as fs from 'fs';

import * as solstoryIdl from './programs/solstory.json'
//this hack takes out the Module type which gets Typescript to stop complaining
const idl2 = JSON.parse(JSON.stringify(solstoryIdl));

// console.log(solstoryIdl)
const SOLSTORY_PUBKEY = "H3iPPJ6td4XPAVmBsygE8NxjnmAgeafPktr59JiV4jAv"

/**
 * @param globalCdn This is the global cdn, which allows for the connecting of NFTs to Metadata/Stories.
 */
type SolstoryConfig = {
  globalCdn?: string,
  cacheTimeout?: number,
}

type MetadataCache = {
  last_all: Date|undefined,
  metadata: {},
}

export interface SolstoryAPI extends Program {
  client: SolstoryClientAPI;
  server: SolstoryServerAPI;
  common: SolstoryCommonAPI;
  globalCdn?: string;
  cacheTimeout: number; //in seconds;
  metadataCache: MetadataCache;
}
/**
 * This is the api object. You can treat it just like a regular anchor program object,
 * but it has the additional "client" and "server" namespaces for common client and
 * server tasks.
 *
 */
export class SolstoryAPI extends Program<Idl> implements SolstoryAPI {
// class SolstoryAPI {
  constructor(solstoryConfig: SolstoryConfig, provider?: Provider, coder?: Coder){
    console.log('init');
    super(idl2.default, SOLSTORY_PUBKEY, provider, coder);
    console.log("api!!", this);

    this.client = new SolstoryClientAPI(this);
    this.server = new SolstoryServerAPI(this);
    this.common = new SolstoryCommonAPI(this);
    this.metadataCache = {
      last_all: undefined,
      metadata: {}
    }


    this.cacheTimeout = 0;
    if (solstoryConfig.cacheTimeout) {
      this.cacheTimeout = solstoryConfig.cacheTimeout;
    }


    ({ globalCdn: this.globalCdn } = solstoryConfig);

    if(solstoryConfig.globalCdn) {
      this.globalCdn = solstoryConfig.globalCdn;
    }

  }
}

