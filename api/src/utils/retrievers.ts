import axios from 'axios';
import ARWeave from 'arweave';
import bs58 from 'bs58'

import { SolstoryMetadata,
  AccessType,
  VisibilityOverride,
  SolstoryHead,
  SolstoryItemContainer,
  SolstoryStory,
  solstoryItemContainerFromString,
} from '../common/types'


const fetchArDriver = async (baseUrl:string, objId: Uint8Array):Promise<SolstoryItemContainer> => {
    const b64 = ARWeave.utils.bufferTob64Url(Buffer.from(objId));
    return axios.get("https://arweave.net/"+objId).then((res)=> {
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


