import * as anchor from '@project-serum/anchor';
import { Program, BN, IdlAccounts } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Solstory } from '../target/types/solstory';
import { NodeWallet, Connection, actions} from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { airdrop, LOCALHOST } from '@metaplex-foundation/amman';
import { sinon } from 'sinon';
import { mockAxios200 } from './utils/mockMetaplex';



//metadata uri from metaplex's own NFT minting test
const metaplexMetadataURI =
  'https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link';

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const should = chai.should();
const expect = chai.expect;
chai.use(chaiAsPromised);

describe('solstory', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Solstory as Program<Solstory>;
  //invalid in anchor test bc we use a one time deplyyyy
  const programDataAddress = findProgramAddressSync(
    [program.programId.toBytes()],
    new anchor.web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
  )[0];
  const connection = new Connection(LOCALHOST, 'confirmed');

  //pubkey for the writer program!
  const writerKey = Keypair.generate()
  const writerWallet = new NodeWallet(writerKey);
  //pubkey for an NFT program
  const nftOwnerKey = Keypair.generate();
  const nftOwnerWallet = new NodeWallet(nftOwnerKey);
  //pubkey for an NFT program
  const nftOwner2Key = Keypair.generate();
  const nftOwner2Wallet = new NodeWallet(nftOwner2Key);
  //pubkey for a malicious user
  const eveKey = Keypair.generate();
  const eveWallet = new NodeWallet(eveKey);
  mockAxios200([nftOwnerWallet, nftOwner2Wallet]);
  let mint, mint2;

  // Configure the client to use the local cluster.
  before(async () => {
    await airdrop(connection, writerKey.publicKey, 3);
    await airdrop(connection, nftOwnerKey.publicKey, 3);
    await airdrop(connection, nftOwner2Key.publicKey, 3);
    await airdrop(connection, eveWallet.publicKey, 3);
    console.log("finished befores");

    //mint an nft for us to create a writer for
    const mintNFTArgs: actions.MintNFTParams = {
      connection,
      maxSupply: 1,
      uri: metaplexMetadataURI,
      wallet: nftOwnerWallet,
    }

    const mintResp = await actions.mintNFT(mintNFTArgs);
    console.log("minted an NFT", mintResp);
    mint = mintResp.mint;

    mintNFTArgs.wallet = nftOwner2Wallet
    const mint2Resp = await actions.mintNFT(mintNFTArgs);
    mint2 = mint2Resp.mint;

  });

  it('Is initialized!', async function() {
    console.log("Begin first");
    // Add your test here.
    const [_pda, _nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory_pda"))],
      program.programId
    );

    const pda = _pda;

    const tx = program.rpc.initialize({
      accounts: {
        solstoryPda: pda,
        authority: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
    },
    signers:[program.provider.wallet.payer]
    });
    console.log("Your transaction signature", tx);
    return tx;
  });

  it('Is creates a writer account as the owner', async function () {
    //requires...
    //I create a metaplex mint
    //hmmmm
    //gotta figure out how to do that in JYES
    const [_writerPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this
    console.log(_writerPda.toBase58())

    const writerPda = _writerPda;
    const metaplex_pda = await Metadata.getPDA(mint);
    const acts = {
        writerProgram: writerWallet.publicKey,
        ownerProgram: nftOwnerWallet.publicKey,
        tokenMint: mint,
        writerPda: writerPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplex_pda,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }

    const tx = program.rpc.createWriterOwner({
      label: "Writer's Log By Owner",
      url: "www.example.com",
      logo: "www.example.com",
      cdn: "",
    },
    {
      accounts: acts,
      signers: [nftOwnerWallet.payer]

    }
    );
    console.dir(tx);
    return tx;


  })

  it('Fails to create a writer when not the owner', async function () {
    //requires...
    //I create a metaplex mint
    //hmmmm
    //gotta figure out how to do that in JYES
    const [_writerPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint2.toBuffer(), eveWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this
    console.log(_writerPda.toBase58())

    const writerPda = _writerPda;
    const metaplex_pda = await Metadata.getPDA(mint2);
    const acts = {
        writerProgram: eveWallet.publicKey,
        ownerProgram: nftOwner2Wallet.publicKey,
        tokenMint: mint2,
        writerPda: writerPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplex_pda,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }

    const tx = program.rpc.createWriterOwner({
      label: "Writer's Log By Owner",
      url: "www.example.com",
      logo: "www.example.com",
      cdn: "",
    },
    {
      accounts: acts,
      signers: [eveWallet.payer]

    }
    );
    return tx.should.be.rejected;


  })
});
