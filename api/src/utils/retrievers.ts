import axios from 'axios';
import ARWeave from 'arweave';
import bs58 from 'bs58'

import { SolstoryMetadata,
  AccessType,
  VisibilityOverride,
  SolstoryHead,
  SolstoryItemContainer,
  SolstoryStory,
} from '../common/types'
import {solstoryItemContainerFromString } from '../common/conversions'


// ARweave can't export their module right SO
let arweave:any;
//@ts-ignore checking for bad import on client
if(ARWeave.default){
    //@ts-ignore checking for bad import on client
    arweave = ARWeave.default;
}else{
    arweave = ARWeave;
}


const fetchArDriver = async (baseUrl:string, objId: Uint8Array):Promise<SolstoryItemContainer> => {
    console.log("ARWEAVE", arweave);
    const b64 = arweave.utils.bufferTob64Url(Buffer.from(objId));
    return axios.get("https://arweave.net/"+b64).then((res)=> {
        console.log("ardriver fetch", res);
        return (solstoryItemContainerFromString(res.data));
    });
}

const fetchUrl = async (baseUrl:string, objId: Uint8Array):Promise<SolstoryItemContainer> => {
    // We're not going to do ARweave's fancy base64-but-swap-certain-chars-so-it's-url-safe
    // just usse base58
    const urlPart = Buffer.from(objId).toString('base64url');
    return axios.get(baseUrl + urlPart).then((res)=> {
        return (solstoryItemContainerFromString(res.data));
    });

}

const fetchPda = async (baseUrl:string, objId: Uint8Array):Promise<SolstoryItemContainer> => {
    throw Error("PDA storage will be implemented in a later edition");
}

export function getRetriever(key: string): (baseUrl:string, objId: Uint8Array)=>Promise<SolstoryItemContainer>{
    const funcs = {
        'ardrive': fetchArDriver,
        'url': fetchUrl,
        'pda': fetchPda,
    }

    return funcs[key]
}


