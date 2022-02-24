import {
  atom,
} from 'recoil';

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
  default: undefined
})
