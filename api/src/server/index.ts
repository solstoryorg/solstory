import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import * as api from '../';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { Metadata } from '../common/types';
import { SolstoryServerOwnerAPI } from './owner';
import { SolstoryServerWriterAPI } from './writer';


export class SolstoryServerAPI {
  program: api.SolstoryAPI;
  writer: SolstoryServerWriterAPI;
  owner: SolstoryServerOwnerAPI;
  constructor(anchorProgram: api.SolstoryAPI){
    this.program = anchorProgram;
    this.writer = new SolstoryServerWriterAPI(anchorProgram)
    this.owner = new SolstoryServerOwnerAPI(anchorProgram)

  }

}

