import { readFile } from 'fs/promises';
import { Keypair, Connection } from '@solana/web3.js'

export const keypairFromFile = async (filepath: string): Promise<Keypair> => {

  return readFile(filepath, 'utf8').then((str) => {
    const key = Uint8Array.from(JSON.parse(str))
    return Keypair.fromSecretKey(key);
  })
}
