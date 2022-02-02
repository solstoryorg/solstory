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

const NEEDED_NFTS = 4;

var initialized = false;
var queue = []


const getWallet = async () => {
  if(!initialized) {
    await initialize();
  }
  let item = queue.shift();
  return item;
}

const initialize = async () => {
  const promises = []
  const connection = new Connection(LOCALHOST, 'confirmed');
  for (let i=0;i<NEEDED_NFTS;i++){
    promises.push(generateWallet(connection))
  }
  initialized = true;
  mockAxios200(queue.map((i)=>{return i[0]}));
  return Promise.all(promises);

}

const uri =
  'https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link';

const mockAxios200 = (wallet: Wallet[], secondSigner: Keypair | undefined = undefined) => {
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
  if (secondSigner) {
    mockedResponse.data.properties.creators.push({
      address: secondSigner.publicKey.toString(),
      verified: 0,
      share: 0,
    });
  }
  sinon.stub(axios, "get").resolves(Promise.resolve(mockedResponse));
};


const generateWallet = async (connection) => {
  const payer = Keypair.generate();
  const wallet = new NodeWallet(payer);

  queue.push([wallet, payer]);
  return airdrop(connection, payer.publicKey, 3);


};
export {getWallet, generateWallet}
