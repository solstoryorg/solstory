import * as api from '../';
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

