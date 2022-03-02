import {
  atom,
} from 'recoil';
import { useAnchorWallet, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

import { Provider } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";

const RPC_ENDPOINT_URL = "http://localhost:8899"

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
  dangerouslyAllowMutability: true,
  effects: [
    (opts) => {

    }]
})
