import {
  atom,
} from 'recoil';
import { useAnchorWallet, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

import * as Solstory from '@solstory/api';
import { Provider } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";

const RPC_ENDPOINT_URL = "http://localhost:8899"
const { SolstoryAPI } = Solstory.default;

export const connectionAtom = atom({
  key: 'solanaConnection',
  default: undefined
})

export const popupAtom = atom({
  key: 'popupAtom',
  default: undefined
})


export const globalWalletAtom = atom({
  key: 'globalWallet',
  default: undefined
})

export const solstoryProgramAtom = atom({
  key: 'solstoryProgram',
  default: undefined,
  effects: [
    (opts) => {

    }]
})
