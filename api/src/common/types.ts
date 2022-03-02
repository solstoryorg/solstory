

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
export type Head = {
  uuid: string, //should be a uuid
  authorized: boolean,
  visibilityOverride: VisibilityOverride,
  dataHash: string,
  accessType: AccessType,
}

export type Item = {

}

