import { Program, BN, IdlAccounts, Idl, Address, Provider, Coder } from '@project-serum/anchor';

export class SolstoryServerAPI {
  program: Program;
  constructor(anchorProgram: Program){
    this.program = anchorProgram;
  }
}
