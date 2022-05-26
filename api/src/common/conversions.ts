import { PublicKey } from '@solana/web3.js';
import {SolstoryMetadata, SolstoryHead, SolstoryItemInner, SolstoryItemContainer, SolstoryStory } from './types'
/**
 * Returns the json stringified version of a SolstoryMetadata.
 *
 * Since this object does not contain any Uint8Array, this is
 * effectively just JSON.stringify.
 *
 */
export function solstoryMetadataToString(input: SolstoryMetadata): string {
  const half = {
    ...input,
  };
  return JSON.stringify(half);
}

/**
 * @param input can be either a serialized string, or the raw JSON.parse object
 */
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
        'apiVersion' in input &&
        'hasExtendedMetadata' in input))
    throw Error("missing items in json")
  // @ts-ignore we've just verified that writerkey exists
  input.writerKey = new PublicKey(input.writerKey);

  return input as SolstoryMetadata;
}

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
    'currentHash' in input &&
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
    throw Error("Missing keys in stringified item")

  const half = {
    ...input,
    // @ts-ignore validated that type exists earlier
    type: input.type as SolstoryItemType
  }

  return half as SolstoryItemInner;
}

/**
 * Note: this function deliberately does not serialize the `verified.item` field, since
 * this should be derived from the `itemRaw` field when loading.
 */
export function solstoryItemContainerToString(input:SolstoryItemContainer):string {
  const half = {
    ...input,
    validated: {
      itemRaw: input.validated.itemRaw,
      itemHash: input.validated.itemHash,
      nextHash: input.validated.nextHash,
      timestamp: input.validated.timestamp,
    }

  };
  return JSON.stringify(half);
}

export function solstoryItemContainerFromString(input: string|object):SolstoryItemContainer {
  if(typeof input === "string")
    input = JSON.parse(input);
  input = input as object
  if(!(
    'validated' in input &&
    // @ts-ignore shorcricuit means this works
    'itemRaw' in input.validated &&
    // @ts-ignore shorcricuit means this works
    'itemHash' in input.validated &&
    // @ts-ignore shorcricuit means this works
    'nextHash' in input.validated &&
    // @ts-ignore shorcricuit means this works
    'timestamp' in input.validated &&
    'hash' in input &&
    'apiVersion' in input &&
    'next' in input &&
    // @ts-ignore shorcricuit means this works
    'objId' in input.next &&
    // @ts-ignore shorcricuit means this works
    'accessType' in input.next))
    throw Error("Missing keys in stringified item container")

    const half:SolstoryItemContainer = {
      // @ts-ignore we just verified this
      hash: input.hash,
      // @ts-ignore we just verified this
      apiVersion: input.apiVersion,
      validated: {
        // @ts-ignore we just verified this
        itemHash: input.validated.itemHash,
        // @ts-ignore we just verified this
        nextHash: input.validated.nextHash,
        // @ts-ignore we just verified this
        timestamp: input.validated.timestamp,
        // @ts-ignore we just verified this
        itemRaw: input.validated.itemRaw,
        // @ts-ignore we just verified this
        item: solstoryItemInnerFromString(input.validated.itemRaw)
      },
      next: {
        // if someone wants to violate standard API by adding extra things here for their service
        // we tacitly allow that.
        // @ts-ignore we just verified this
        ...(input.next),
        // @ts-ignore we just verified this
        objId: Uint8Array.from(Buffer.from(input.next.objId, "base64"))
      }
    }

    return half;
}


export function solstoryStoryToString(obj: SolstoryStory):string {

  const half = {
    metadata: JSON.parse(solstoryMetadataToString(obj.metadata)),
    mintKey: obj.mintKey.toBase58(),
    //array of dictionaries by turning items to strings then parsing to dicts
    items: obj.items.map((item:SolstoryItemContainer) => {
      return JSON.parse(solstoryItemContainerToString(item));
    }),
    headHash: obj.headHash,
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
    'headHash' in input &&
    'items' in input &&
    'next' in input &&
    //@ts-ignore this is valid because short circuit
    'accessType' in input.next &&
    //@ts-ignore this is valid because short circuit
    'objId' in input.next))
    throw Error("Missing keys in stringified story")

  const half = {
    // @ts-ignore we just verified this
    metadata: solstoryMetadataFromString(input.metadata),
    // @ts-ignore we just verified this
    mintKey: new PublicKey(input.mintKey),
    // @ts-ignore we just verified this
    items: input.items.map((obj:any)=> {
      return solstoryItemContainerFromString(obj);
    }),
    // @ts-ignore we just verified this
    headHash: input.headHash,
    next: {
      // @ts-ignore we just verified this
      ...(input.next),
      // @ts-ignore we just verified this
      objId: Uint8Array.from(Buffer.from(input.next.objId, 'base64')),
    }
  }
  return half as SolstoryStory;
}

