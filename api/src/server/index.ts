import * as api from '../';
import { SolstoryServerCreatorAPI } from './creator';
import { SolstoryServerWriterAPI } from './writer';
// import type { SolstoryServerWriterAPI } from './writer'


export class SolstoryServerAPI {
  program: api.SolstoryAPI;
  writer: SolstoryServerWriterAPI;
  creator: SolstoryServerCreatorAPI;
  constructor(anchorProgram: api.SolstoryAPI){
    this.program = anchorProgram;
    this.writer = new SolstoryServerWriterAPI(anchorProgram)
    this.creator = new SolstoryServerCreatorAPI(anchorProgram)

  }

}

export { SolstoryAppendItemOptions } from './writer';

