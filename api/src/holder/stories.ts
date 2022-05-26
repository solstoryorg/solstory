
// filter
// get_multiple_accounts_with_comm

// Why not getProgramAccounts(filter)?
  // We make a deliberate choice here: we can save 64 bytes by removing the ability
  // to programatically load all heads of a program and by finding every head of
  // an NFT by iterating through every single program via getMultipleAccounts
  //
// Once we get to ~100 writer programs we'll switch over to the other method.
  //
  // Incidentally: CDN based workflow solves for this!


  /*
   * Grabs all existing metadatas.
   */
// export function getAllStories(nftKey:PublicKey):


//   const headFilter = nftKey.toBuffer()
//   solstoryProgram.accounts.WriterHead.all(filter

