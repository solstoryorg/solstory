import { atom, } from 'recoil';
import * as Solstory from '@solstory/api';
const RPC_ENDPOINT_URL = "http://localhost:8899";
const { SolstoryAPI } = Solstory.default;
export const connectionAtom = atom({
    key: 'solanaConnection',
    default: undefined
});
export const popupAtom = atom({
    key: 'popupAtom',
    default: undefined
});
export const globalWalletAtom = atom({
    key: 'globalWallet',
    default: undefined
});
export const solstoryProgramAtom = atom({
    key: 'solstoryProgram',
    default: undefined,
    effects: [
        (opts) => {
        }
    ]
});
