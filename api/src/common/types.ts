

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
  objId: string,
}

export enum SolstoryItemTypes {
  Item, // Just a regular event added to the hashlist
  Correction, // Correction of a previous item
}

export type SolstoryItem = {
  verified: {
    display?: {
      img?: string;
      label?: string;
      long_descripton?: string;
      help_text?: string;
    }
    ref?: string, //item it refers to (for corrections)
    data: any;
  }
  next: {
    uri: string;
    hash: string;
  }
}


