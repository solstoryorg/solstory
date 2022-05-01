import type anchor from '@project-serum/anchor';
import type web3 from '@solana/web3.js';

export type SolstoryMetadata = {
  writerKey: web3.PublicKey;
  /** Title used when displaying this writer. */
  label: string,
  description: string,
  /** URL for more information about this writer. Homepage link, basically. */
  url: string,
  /** URL for the logo to display with this writer. */
  logo: string,
  /** CDN for this writer */
  cdn: string,
  /** Base url, used for AccessType.URL, otherwise is "". */
  baseUrl: string,
  /** Whether this writer is meant to be visible. Set to false for internal programs. */
  visible: boolean,
  /** Whether this writer has been validated by solstory. Meant for fraud and spam protection.*/
  systemValidated?: boolean,
  apiVersion: number,

  /** Additional metadata, JSON format. */
  metadata: any,
  hasExtendedMetadata: boolean,
}


// Make sure this stays corresponding to rust program
/** This looks funny because it's the format enums come back through anchor from the chain */
export type AccessType = {ardrive:{}} | {url:{}} | {pda:{}};
/** @hidden */
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
  /** There's many heads to a single metadata, this is the key back to that metadata */
  metadata: SolstoryMetadata,
  writerKey: web3.PublicKey,
  mintKey: web3.PublicKey
  /** This is the ID of the first item in the hashlist. It is also the most recent item.
   * It is stored in a 32byte binary format, and then decompressed based on the location
   * that the file is stored. This lets us fit 256 bits.*/
  objId: Uint8Array, //should be a uuid
  /** Specifies that the NFT-Update-Owner (usually its creator) has approved of this
   * program being added to the NFT */
  authorized: boolean,
  /** Used by the NFT holder (usually the end user owning the NFT) to sort which writers
   * get displayed in what order.
   *
   * -1 will override to NOT display something that is authorized, while >1 will override
   * TO display something that may or may not be authorized.  0 will follow default behavior. */
  visibilityIndex: number,
  /** We store this as a hex here for interoperability with all the other places we use
   * hex to store hashes, but it's stored as a 32 byte binary on the chain. */
  currentHash: string, //This is hex for interoperability, but binary on chain
  accessType: AccessType,
}

/**
 * We have an internal object representation, but then we also need to stick these onto
 * string only systems, like ardrive or a sql database.
 */

export type UpdateHeadData = {
  timestamp: anchor.BN,
  dataHash: Uint8Array,
  currentHash: Uint8Array,
  newHash: Uint8Array
  objId: Uint8Array,
}

export enum SolstoryItemType {
  Item = "ITEM", // Just a regular event added to the hashlist
  Correction = "CORRECTION", // Correction of a previous item
}


/**
 * Inner item, this is the actual data contained within a solstory item.
 */
export type SolstoryItemInner = {
    type: SolstoryItemType;
    /** Reference to a previous solstory item, by objId. Useful for things like corrections. */
    ref?: string, //item it refers to (for corrections)
    /** Instructions for how to display the item in a client.*/
    display?: {
      img?: string;
      label?: string;
      description?: string;
      helpText?: string;
    }
    data: any;
}


/**
 * This is a wrapper on an item. It handles things like describing the location of the next
 * item.
 *
 * The JSON serialized version of this type is also the expected format of objects stored off
 * chain, so if you wish to manually append an object,
 */
export type SolstoryItemContainer = {
  /** The JSON of this section is what should be validated by the hash.*/
  verified: {
    /** JSON doesn't naturally preserve order, so it's important we pick one stringified
     * representation and then stick with it. Since there's a single source of truth this
     * just means we need to save the original `JSON.stringify` when the item is created.
     */
    itemRaw: string,
    item: SolstoryItemInner,
    itemHash: string;
    nextHash: string;
    timestamp: number; //unix timestamp, not javascript
  }
  /** Whether the api was able to verify that the data hadn't been tampered with. This being set to false suggests tampering. */
  verifiedSuccess?: boolean,
  hash: string;
  /** This frequently does not exist on creation, only after upload, which means
   * it is _not_ a mandatory component when instiating a new item. */
  objId?: string; //This doesn't exist on creation, but should exist on loading.
  next: {
    objId: Uint8Array;
    accessType: AccessType,
    cursor?: string
  }
}
export type SolstoryStory = {
  metadata: SolstoryMetadata,
  loading?: boolean,
  mintKey: web3.PublicKey,
  headHash: string,
  items: SolstoryItemContainer[],
  next: {
    objId: Uint8Array,
    accessType: AccessType
    cdnCursor?:any
  }
}



