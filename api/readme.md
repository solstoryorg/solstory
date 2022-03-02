# README

##Structure
This library has a client and a server section. In a *naive* standard use case
you would use the client section to do things like look up NFTs and their stories,
mark stories on owned NFTs as visible or not visible, pretty much everything that
you would do while signing the NFT owners address.

Conversely the server library is for things where you would sign with the NFT
update authority's address (ie the creator of the NFT usually) or with the story
writer's address. Basically it's where you administrate and push events. The two
halves should not be mixed unless you're doing something deliberate, but in case
you are, they currently exist together.


## Usage

When using this clientside, it's highly recommended to use the solana wallet adapter
cra found here: https://github.com/solana-labs/wallet-adapter/blob/master/packages/starter/create-react-app-starter/config-overrides.js

You'll need to browserify stream anyway for the adapter to work, and for our purposes
you should browserify `crypto` and `buffer`

