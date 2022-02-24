import * as utils from "./utils/index";
import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import { SolstoryClientAPI } from './client'
import { SolstoryServerAPI } from './server'
import { SolstoryCommonAPI } from './common'
import * as fs from 'fs';

// import * as solstoryIdl from './programs/solstory.json'

// console.log(solstoryIdl)
const SOLSTORY_PUBKEY = "H3iPPJ6td4XPAVmBsygE8NxjnmAgeafPktr59JiV4jAv"

const idl = JSON.parse(fs.readFileSync("./programs/solstory.json", "utf8"));
console.log(idl);
/**
 * @param globalCdn This is the global cdn, which allows for the connecting of NFTs to Metadata/Stories.
 */
type SolstoryConfig = {
  globalCdn?: string,
}
/**
 * This is the api object. You can treat it just like a regular anchor program object,
 * but it has the additional "client" and "server" namespaces for common client and
 * server tasks.
 *
 */
class SolstoryAPI extends Program {
  client: SolstoryClientAPI;
  server: SolstoryServerAPI;
  common: SolstoryCommonAPI;
  globalCdn?: string;
  constructor(solstoryConfig: SolstoryConfig, provider?: Provider, coder?: Coder){
    super(idl, SOLSTORY_PUBKEY, provider, coder);
    console.log("bob");
    console.log("bob");
    console.log("bob");
    this.client = new SolstoryClientAPI(this);
    this.server = new SolstoryServerAPI(this);
    this.common = new SolstoryCommonAPI(this);
    if(solstoryConfig.globalCdn) {
      this.globalCdn = solstoryConfig.globalCdn;
    }

  }
}

const api = {
  utils,
  SolstoryAPI
};

export default api;
