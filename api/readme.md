# README

## Structure
The solstory API is a direct subclass of the automatically generated anchor API, which
means you can interact with it in the same way you would any other anchor application.
In addition, the API contains a {@link SolstoryClientAPI |client},
{@link SolstoryServerWriterAPI |server/writer} (a system writing data to solstory
hashlists) and {@link SolstoryServerCreatorAPI |server/creator}
(an NFT creator wishing to add or approve applications implementing
solstory functionality to their NFTs) section to fulfill common workflows and
tasks for each of these parties.

For a better overview of the architecutre as a whole, see the docusaursu.

The convenience libraries (client writer/server writer/creator) natively sign requests
in that respective role with the key that SolstoryAPI/Anchor was initialized with. If
the API was initialized with the useAnchorWallet capability of the solana-wallet-adapter
library, then this will lead to a signature request visible to the user.

If this behavior is unwanted, simply use the exposed anchor methods–architecture primitives
are enforced on the server side, though it's worth checking out the types and making sure
that any self hosted thirdparty {@link SolstoryItemContainer} fits the spec.

## Usage

When using this clientside, it's highly recommended to use the solana wallet adapter
cra found here: https://github.com/solana-labs/wallet-adapter/blob/master/packages/starter/create-react-app-starter/config-overrides.js

You'll need to browserify stream anyway for the adapter to work, and for our purposes
you should browserify `crypto` and `buffer`

