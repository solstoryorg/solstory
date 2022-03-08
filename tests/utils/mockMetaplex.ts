/*
 * Tools for creating fake on chain metaplex NFTs
 *
 * A lot of this is just taken directly from
 * https://github.com/metaplex-foundation/js/blob/main/test/actions/shared
 *
 * This is currently a necessity since the library interacts with third party libs , doesn't
 * ship with these utils included, and we don't have good tooling to mock the on-chain aspects yet.
 * We _could_ just write the identical code again but at some point that's not helpful.
 *
 * Anyway, thanks metaplex for writing comprehensive tests so we can write comprehensive tests as well!
 *
 * we modify this to use sinon instead of jest.
 */

import { Keypair } from '@solana/web3.js';
import axios, { AxiosResponse } from 'axios';
import { airdrop, LOCALHOST } from '@metaplex-foundation/amman';

import { Connection, NodeWallet, actions, Wallet } from '@metaplex/js';

import * as sinon from 'sinon';

// because of a metaplex limitation total must evenly divide 100
const NEEDED_NFTS = {'creation': 2, 'hashlist':2};

var initialized = false;
var queue = []
var walletList = []


const getWallet = async (key) => {
  if(!initialized) {
    await initialize();
  }
  let item = queue[key].shift();
  return item;
}

const initialize = async () => {
  const promises = []
  const connection = new Connection(LOCALHOST, 'confirmed');
  let j = 0
  for (const key in NEEDED_NFTS){
    queue[key] = []
    j++;
    for (let i=0;i<NEEDED_NFTS[key];i++){
      //javascript into -> string coorsion means this gives us a 32 letter string with 10000+i at the last 5 digits
      promises.push(generateWallet(connection, '003000000000444400000000000'+(10000+(100*j)+i),key))
    }
  }
  initialized = true;
  mockAxios200(walletList.map((i)=>{return i[0]}));
  return Promise.all(promises);

}

const uri =
  'https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link';

const mockAxios200 = (wallet: Wallet[], secondSigner: Keypair | undefined = undefined) => {
  console.log("ATTEMPTING MOCK");
  const mockedResponse = {
    data: {
      name: 'Holo Design (0)',
      symbol: '',
      description:
        'A holo of some design in a lovely purple, pink, and yellow. Pulled from the Internet. Demo only.',
      seller_fee_basis_points: 100,
      image: uri,
      external_url: '',
      properties: {
        creators: wallet.map((item) => {return {
            address: item.publicKey.toString(),
            verified: 1,
            share: 100/wallet.length,
          };
        }),
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };
  console.dir(mockedResponse, {depth: 10});
  if (secondSigner) {
    mockedResponse.data.properties.creators.push({
      address: secondSigner.publicKey.toString(),
      verified: 0,
      share: 0,
    });
  }
  // This will fail if the the primary axios package is not the one requested by @metaplex/js.
  sinon.stub(axios, "get").resolves(Promise.resolve(mockedResponse));
};


const generateWallet = async (connection, seed, key) => {
  const payer = Keypair.fromSeed(Uint8Array.from(seed));
  const wallet = new NodeWallet(payer);

  queue[key].push([wallet, payer]);
  walletList.push([wallet, payer]);
  console.log("Generated wallet for key", key, payer.publicKey.toBase58());
  return airdrop(connection, payer.publicKey, 3);


};
export {getWallet, generateWallet}
