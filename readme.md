# Solstory

Solstory is a data layer for Solana nfts. It consists of more or less four components:
- A solana program.
- A typescript API
- A typescript spec for data stored on that API
- A cdn standard.

You can find the first three in this repo. Documentation for everything typescript can be found at
[the github pages](https://solstoryorg.github.io/solstory/). They're heavily annotated so they're
a good read.

Notes on archecture and high level design can be found on our docusaurus.

It's worth checking out the other repos in this org for three examples of how to
interact with the solstory API. Two are server implementations, one is a
reference client.

# Usage

Clone this repo.

```
anchor build
cd api
yarn install
yarn build
yarn link
```

Now navigate to whatever project you want to use the solstory API in and run `yarn link` again there.

NPM version coming once I've taken a nap and had a chance to verify all of this with fresh eyes.

