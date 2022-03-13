import { BUNDLR_NODE_URL, BUNDLR_DEVNET_URL } from '../constants'
import type anchor from '@project-serum/anchor';
import type web3 from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

export type SolstoryMetadata = {
  writerKey: web3.PublicKey;
  label: string,
  description: string,
  url: string,
  logo: string,
  cdn: string,
  baseUrl: string,

  metadata: string,
  hasExtendedMetadata: boolean,
  extendedMetadata: {}
}

export function solstoryMetadataToString(input: SolstoryMetadata): string {
  const half = {
    ...input,
    writerKey: input.writerKey.toBase58(),
  };
  return JSON.stringify(half);
}

export function solstoryMetadataFromString(input: string|object):SolstoryMetadata {
  if(typeof input == "string"){
    input = JSON.parse(input);
  }
  input = input as object

  if(!('writerKey' in input &&
        'label' in input &&
        'description' in input &&
        'url' in input &&
        'logo' in input &&
        'cdn' in input &&
        'baseUrl' in input &&
        'metadata' in input &&
        'hasExtendedMetadata' in input &&
        'extendedMetadata' in input))
    throw Error("missing items in json")
  // @ts-ignore we've just verified that writerkey exists
  input.writerKey = new PublicKey(input.writerKey);

  return input as SolstoryMetadata;
}

// Make sure this stays corresponding to rust program
export type AccessType = {ardrive:{}} | {url:{}} | {pda:{}};
export const AccessTypeIndex = {
  ArDrive: { ardrive:{}},
  URL: { url:{}},
  PDA: { pda:{}},
}

// Make sure this stays corresponding to rust program
export enum  VisibilityOverride {
  Default,
  Visible,
  Hidden
}

// We need to proxy this so we have compatibility with caching.
export type SolstoryHead = {
  metadata: SolstoryMetadata,
  writerKey: web3.PublicKey,
  mintKey: web3.PublicKey
  objId: Uint8Array, //should be a uuid
  authorized: boolean,
  visibilityIndex: number,
  dataHash: string,
  accessType: AccessType,
}

/**
 * We have an internal object representation, but then we also need to stick these onto
 * string only systems, like ardrive or a sql database.
 */
export function solstoryHeadToString(obj:SolstoryHead):string{
  const half  = {
    ...obj,
    // We want it to be in a jsonable dict, because we rerun JSON.stringify again here
    metadata: JSON.parse(solstoryMetadataToString(obj.metadata)),
    writerKey: obj.writerKey.toBase58(),
    mintKey: obj.mintKey.toBase58(),
    objId: Buffer.from(obj.objId).toString('base64'),
    //we potentially have an access type problem but it _should_ serialize right.
  }
  return JSON.stringify(half);
}
export function solstoryHeadFromString(input: string|object):SolstoryHead{
  if(typeof input === 'string')
    input = JSON.parse(input);
  input = input as object;

  if(!('metadata' in input &&
    'writerKey' in input &&
    'mintKey' in input &&
    'objId' in input &&
    'authority' in input &&
    'visibilityIndex' in input &&
    'dataHash' in input &&
    'accessType' in input))
    throw Error("Missing keys in stringified head")

  const half = {
    ...input,
    // @ts-ignore we just checked for metadata in input
    metadata: solstoryMetadataFromString(input.metadata),
    // @ts-ignore we just checked for writerKey in input
    writerKey: new PublicKey(input.writerKey),
    // @ts-ignore we just checked for mintKey in input
    mintKey: new PublicKey(input.mintKey),
    // @ts-ignore we just checked for mintKey in input
    objId: Uint8Array.from(Buffer.from(input.objId, 'base64'))

  }
  return half as SolstoryHead
}

export type UpdateHeadData = {
  timestamp: anchor.BN,
  dataHash: Uint8Array,
  prevHash: Uint8Array,
  newHash: Uint8Array
  objId: Uint8Array,
}

export enum SolstoryItemType {
  Item = "ITEM", // Just a regular event added to the hashlist
  Correction = "CORRECTION", // Correction of a previous item
}

export function solstoryItemInnerToString(input:SolstoryItemInner):string {
  const half = {
    ...input,
  }
  return JSON.stringify(half);
}

export function solstoryItemInnerFromString(input:string|object):SolstoryItemInner {
  if(typeof input === "string")
    input = JSON.parse(input);
  input = input as object
  if(!(
    'type' in input &&
    'data' in input))
    throw Error("Missing keys in stringified head")

  const half = {
    ...input,
    // @ts-ignore validated that type exists earlier
    type: input.type as SolstoryItemType
  }

  return half as SolstoryItemInner;
}

export type SolstoryItemInner = {
    type: SolstoryItemType;
    ref?: string, //item it refers to (for corrections)
    display?: {
      img?: string;
      label?: string;
      description?: string;
      helpText?: string;
    }
    data: any;
}

export function solstoryItemContainerToString(input:SolstoryItemContainer):string {
  const half = {
    ...input,
    verified: {
      item: JSON.parse(solstoryItemInnerToString(input.verified.item)),
      itemHash: input.verified.itemHash,
      prevHash: input.verified.prevHash,
      timestamp: input.verified.timestamp,
    }

  };
  return JSON.stringify(half);
}

export function solstoryItemContainerFromString(input: string|object):SolstoryItemContainer {
  if(typeof input === "string")
    input = JSON.parse(input);
  input = input as object
  if(!(
    'verified' in input &&
    // @ts-ignore shorcricuit means this works
    'item' in input.verified &&
    // @ts-ignore shorcricuit means this works
    'itemHash' in input.verified &&
    // @ts-ignore shorcricuit means this works
    'prevHash' in input.verified &&
    // @ts-ignore shorcricuit means this works
    'timestamp' in input.verified &&
    'hash' in input &&
    'next' in input &&
    // @ts-ignore shorcricuit means this works
    'objId' in input.verified &&
    // @ts-ignore shorcricuit means this works
    'accessType' in input.verified))
    throw Error("Missing keys in stringified head")

    const half = {
      ...input,
      verified: {
        // @ts-ignore we just verified this
        ...(input.verified),
        // @ts-ignore we just verified this
        item: solstoryItemInnerFromString(input.verified.item)
      },
      next: {
        // @ts-ignore we just verified this
        ...(input.next),
        // @ts-ignore we just verified this
        objId: Uint8Array.from(Buffer.from(input.next.objId, "base64"))
      }
    }

    return half as SolstoryItemContainer;
}


export type SolstoryItemContainer = {
  verified: {
    item: SolstoryItemInner,
    itemHash: string;
    prevHash: string;
    timestamp: number; //unix timestamp, not javascript
  }
  hash: string;
  next: {
    objId: Uint8Array;
    accessType: AccessType,
    cursor?: string
  }
}

/**
 * This section constructs the client facing version of a complete story, so we can bury
 * the complexity of rendering it away from client consumers.
 */
export function solstoryStoryToString(obj: SolstoryStory):string {

  const half = {
    metadata: JSON.parse(solstoryMetadataToString(obj.metadata)),
    mintKey: obj.mintKey.toBase58(),
    //array of dictionaries by turning items to strings then parsing to dicts
    items: obj.items.map((item:SolstoryItemContainer) => {
      return JSON.parse(solstoryItemContainerToString(item));
    }),
    next: {
      ...(obj.next),
      objId: Buffer.from(obj.next.objId).toString('base64'),
    }
  }
  return JSON.stringify(half);
}

export function solstoryStoryFromString(input: string|object): SolstoryStory {
  if(typeof input === "string")
    input = JSON.parse(input);
  input = input as object
  if(!(
    'metadata' in input &&
    'mintKey' in input &&
    'items' in input &&
    'next' in input &&
    //@ts-ignore this is valid because short circuit
    'accessType' in input.next &&
    //@ts-ignore this is valid because short circuit
    'objId' in input.next))
    throw Error("Missing keys in stringified head")

  const half = {
    // @ts-ignore we just verified this
    metadata: solstoryMetadataFromString(input.metadata),
    // @ts-ignore we just verified this
    mintKey: new PublicKey(input.mintKey),
    // @ts-ignore we just verified this
    items: input.items.map((obj:any)=> {
      return solstoryItemContainerFromString(obj);
    }),
    next: {
      // @ts-ignore we just verified this
      ...(input.next),
      // @ts-ignore we just verified this
      objId: Uint8Array.from(Buffer.from(input.next.objId, 'base64')),
    }
  }
  return half as SolstoryStory;
}

export type SolstoryStory = {
  metadata: SolstoryMetadata,
  mintKey: web3.PublicKey,
  items: SolstoryItemContainer[],
  next: {
    objId: Uint8Array,
    accessType: AccessType
    cdnCursor?:any
  }
}



