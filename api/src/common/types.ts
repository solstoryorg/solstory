import { BUNDLR_NODE_URL, BUNDLR_DEVNET_URL } from '../constants'

export type Metadata = {
  writerKey: string;
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

// Make sure this stays corresponding to rust program
export enum AccessType {
  ArDrive,
  URL,
  PDA,
}

// Make sure this stays corresponding to rust program
export enum  VisibilityOverride {
  Default,
  Visible,
  Hidden
}

// We need to proxy this so we have compatibility with caching.
export type SolstoryHead = {
  uuid: string, //should be a uuid
  authorized: boolean,
  visibilityOverride: VisibilityOverride,
  dataHash: string,
  accessType: AccessType,
}

export type UpdateHeadData = {
  timestamp: number,
  dataHash: Uint8Array,
  prevHash: Uint8Array,
  newHash: Uint8Array
  objId: Uint8Array,
}

export enum SolstoryItemType {
  Item, // Just a regular event added to the hashlist
  Correction, // Correction of a previous item
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

export type SolstoryItemContainer = {
  verified: {
    item: SolstoryItemInner,
    itemHash: string;
    prevHash: string;
    timestamp: number; //unix timestamp, not javascript
  }
  hash: string;
  next: {
    uri: string;
  }
}

