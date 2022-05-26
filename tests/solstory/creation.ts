import * as anchor from '@project-serum/anchor';
import { Program, BN, IdlAccounts } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Solstory } from '../../target/types/solstory';
import { NodeWallet, Connection, actions} from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { airdrop, LOCALHOST } from '@metaplex-foundation/amman';
import { getWallet } from '../utils/mockMetaplex';
import { SOLSTORY_FEE_DESTINATION } from '../utils/constants';
import { step, xstep } from 'mocha-steps';

import axios, { AxiosResponse } from 'axios';
import * as sinon from 'sinon';

//metadata uri from metaplex's own NFT minting test
const metaplexMetadataURI =
  'https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link';

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");


const should = chai.should();
const expect = chai.expect;
chai.use(chaiAsPromised);

describe('solstory creation', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Solstory as Program<Solstory>;
  const connection = new Connection(LOCALHOST, 'confirmed');

  //pubkey for the writer program!
  const writerKey = Keypair.fromSeed(Uint8Array.from('00100000000044440000000000000001'))
  const writerWallet = new NodeWallet(writerKey);
  //pubkey for an NFT program

  //pubkey for a malicious user
  const eveKey = Keypair.fromSeed(Uint8Array.from('00100000000044440000000000000002'))
  const eveWallet = new NodeWallet(eveKey);
  //create wallets for other tests to consume
  //we do this because we can only mock once
  let mint, mint2;
  let nftCreatorWallet, nftCreator2Wallet;

  // Configure the client to use the local cluster.
  before(async () => {
    await airdrop(connection, writerKey.publicKey, 3);
    await airdrop(connection, eveWallet.publicKey, 3);
    nftCreatorWallet = (await getWallet('creation'))[0];
    //pubkey for an NFT program
    nftCreator2Wallet = (await getWallet('creation'))[0];
    console.log("creation wallets", nftCreatorWallet.publicKey, nftCreator2Wallet.publicKey);


    //mint an nft for us to create a writer for
    const mintNFTArgs: actions.MintNFTParams = {
      connection,
      maxSupply: 1,
      uri: metaplexMetadataURI,
      wallet: nftCreatorWallet,
    }

    const mintResp = await actions.mintNFT(mintNFTArgs);
    mint = mintResp.mint;

    mintNFTArgs.wallet = nftCreator2Wallet
    const mint2Resp = await actions.mintNFT(mintNFTArgs);
    mint2 = mint2Resp.mint;

    const [solstoryPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory_pda"))],
      program.programId
    ); //TODO: library function for this

    try {
      await program.rpc.initialize({
        accounts:{
          solstoryPda: solstoryPda,
          authority: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      signers:[program.provider.wallet.payer]
      });
    }catch (e) {
      console.warn("init failed with ", e);

    }


  });

  //Skip this test because we _always_ initialize in the before function at this point.
  xit('Is initialized!', async function() {
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
    // console.log("Your transaction signature", tx);
    return tx;
  });

  it('creates a writer metadata account', async function () {
    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const [solstoryPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory_pda"))],
      program.programId
    ); //TODO: library function for this

    const writerMetadataPda = writerMetadataPda;
    const acts = {
        writerProgram: writerWallet.publicKey,
        creatorProgram: nftCreatorWallet.publicKey,
        writerMetadataPda: writerMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        solstoryPda: solstoryPda,
      }

    return program.rpc.createWriterMetadata(
      {
        label: "creation metadata",
        description: "metadata from 'creates a writer metadata account'",
        logo: "www.example.com",
        url: "www.example.com",
        cdn: "",
        metadata: "",
        visible: true
      },
    {
      accounts: acts,
      signers: [writerWallet.payer]

    }).then((tx) => {
      console.log("stuff from metadata", tx)
      program.account.writerMetadata.fetch(writerMetadataPda)
      .then((meta)=>{
        console.log("meta from createwritermeta", meta);
        return meta.label.is.equal("creation metadata");
      })
    });



  });

  it('creates extended metadata', async function() {
    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const [writerExtendedMetadataPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), Buffer.from(anchor.utils.bytes.utf8.encode("extended")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const acts = {
        writerProgram: writerWallet.publicKey,
        writerMetadataPda: writerMetadataPda,
        extendedMetadataPda: writerExtendedMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    const tx = program.rpc.setExtendedMetadata(JSON.stringify("{metadata: \"here\""),
    {
      accounts: acts,
      signers: [writerWallet.payer]

    }
    );
    // console.dir(tx);
    return tx.then((tx)=>{
      program.account.extendedMetadata.fetch(writerExtendedMetadataPda)
      .then((meta)=> {
        return JSON.parse(meta.extendedMetadata).metadata.is.equal('here');
      });
    });

  });

  it('updates extended metadata', async function() {
    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const [writerExtendedMetadataPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), Buffer.from(anchor.utils.bytes.utf8.encode("extended")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const acts = {
        writerProgram: writerWallet.publicKey,
        writerMetadataPda: writerMetadataPda,
        extendedMetadataPda: writerExtendedMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    const tx = program.rpc.setExtendedMetadata(JSON.stringify("{metadata: \"less\""),
    {
      accounts: acts,
      signers: [writerWallet.payer]

    }
    );
    return tx.then((tx)=>{
      program.account.extendedMetadata.fetch(writerExtendedMetadataPda)
      .then((meta)=> {
        return JSON.parse(meta.extendedMetadata).metadata.is.equal('less');
      });
    });
  });

  it('too-big extended metadata fails', async function() {
    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const [writerExtendedMetadataPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), Buffer.from(anchor.utils.bytes.utf8.encode("extended")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const acts = {
        writerProgram: writerWallet.publicKey,
        writerMetadataPda: writerMetadataPda,
        extendedMetadataPda: writerExtendedMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    const tx = program.rpc.setExtendedMetadata(JSON.stringify("{metadata: \"this is more\""),
    {
      accounts: acts,
      signers: [writerWallet.payer]

    }
    );
    return tx.should.eventually.be.rejectedWith("A space constraint was violated");
  });

  it('deletes extended metadata', async function() {
    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const [writerExtendedMetadataPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), Buffer.from(anchor.utils.bytes.utf8.encode("extended")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const acts = {
        writerProgram: writerWallet.publicKey,
        writerMetadataPda: writerMetadataPda,
        extendedMetadataPda: writerExtendedMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    const tx = program.rpc.deleteExtendedMetadata(
    {
      accounts: acts,
      signers: [writerWallet.payer]

    }
    );
    return tx.then((tx)=>{
      program.account.extendedMetadata.fetch(writerExtendedMetadataPda)
      .should.eventually.be.rejected;
    });
  });

  it('Is creates a writer head account as the creator', async function () {
    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this


    const [writerHeadPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const metaplex_pda = await Metadata.getPDA(mint);
    const acts = {
        writerProgram: writerWallet.publicKey,
        creatorProgram: nftCreatorWallet.publicKey,
        tokenMint: mint,
        writerHeadPda: writerHeadPda,
        writerMetadataPda: writerMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplex_pda,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        solstoryFeeDestination: SOLSTORY_FEE_DESTINATION,
      }

    const tx = program.rpc.createWriterHeadCreator(
    {
      accounts: acts,
      signers: [nftCreatorWallet.payer]

    }
    );
    // console.dir(tx);
    return tx;


  })

  it('it adjusts the visibility index', async function () {

      const largestAccounts = await program.provider.connection.getTokenLargestAccounts(new PublicKey(mint));
      const largestAccountInfo = await program.provider.connection.getParsedAccountInfo(largestAccounts.value[0].address);

      const TOKEN = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const ATOKEN = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

    const [writerHeadPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const acts = {
        writerProgram: writerWallet.publicKey,
        tokenMint: mint,
        token: largestAccounts.value[0].address,
        writerHeadPda: writerHeadPda,
        holderKey: largestAccountInfo.value.data.parsed.info.owner,
        tokenProgram: new PublicKey(TOKEN),
      }

    const tx = program.rpc.updateVisibilityIndex(10,
    {
      accounts: acts,
      signers: [nftCreatorWallet.payer]

    }
    );
    // console.dir(tx);
    return tx;


  })
  /*
   * This test eve attempts to create an authorized writer by creating the writer
   * as the creator.
   */
  it('Fails to create a writer head when not the creator', async function () {
    const [writerHeadPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint2.toBuffer(), eveWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const metaplex_pda = await Metadata.getPDA(mint2);
    const acts = {
        writerProgram: eveWallet.publicKey,
        creatorProgram: nftCreator2Wallet.publicKey,
        tokenMint: mint2,
        writerHeadPda: writerHeadPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplex_pda,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        solstoryFeeDestination: SOLSTORY_FEE_DESTINATION,
      }

    const tx = program.rpc.createWriterHeadCreator(
    {
      accounts: acts,
      signers: [eveWallet.payer]

    }
    );
    // console.dir(tx);
    //TODO: get this to check for 0x32ca
    return tx.should.be.rejected;
  });

  it('Fails to lie about the creator program', async function () {
    const [writerHeadPda, _nonce2] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint2.toBuffer(), eveWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const metaplex_pda = await Metadata.getPDA(mint2);
    const acts = {
        writerProgram: eveWallet.publicKey,
        creatorProgram: writerWallet.publicKey,
        tokenMint: mint2,
        writerMetadataPda: writerMetadataPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        metaplexMetadataPda: metaplex_pda,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        writerHeadPda: writerHeadPda,
        solstoryFeeDestination: SOLSTORY_FEE_DESTINATION,
      }

    const tx = program.rpc.createWriterHeadCreator(
    {
      accounts: acts,
      signers: [writerWallet.payer]

    }
    );
    return tx.should.be.rejected;
  });

  describe('writer test flow', function() {
      step('Succeeds in creating a writer head as the not-creator', async function () {
      const [writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this


      const [writerHeadPda, _nonce2] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint2.toBuffer(), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this

      const metaplex_pda = await Metadata.getPDA(mint2);
      const acts = {
          writerProgram: writerWallet.publicKey,
          creatorProgram: nftCreator2Wallet.publicKey,
          tokenMint: mint2,
          writerHeadPda: writerHeadPda,
          writerMetadataPda: writerMetadataPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          metaplexMetadataPda: metaplex_pda,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          solstoryFeeDestination: SOLSTORY_FEE_DESTINATION,
        }

      const tx = program.rpc.createWriterHeadWriter(
      {
        accounts: acts,
        signers: [writerWallet.payer]

      }
      );
      // console.dir(tx);
      return tx;
    });

    step('Able to authorize a writer', async function () {
      const [writerHeadPda, _nonce] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint2.toBuffer(), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this

      const metaplex_pda = await Metadata.getPDA(mint2);
      const acts = {
          writerProgram: writerWallet.publicKey,
          creatorProgram: nftCreator2Wallet.publicKey,
          tokenMint: mint2,
          writerHeadPda: writerHeadPda,
          metaplexMetadataPda: metaplex_pda,
        }

      const tx = program.rpc.authorizeWriter(
      {
        accounts: acts,
        signers: [nftCreator2Wallet.payer]
      }
      );
      return tx.then((tx) => {
        // get the pda and verify it's authorized
        return program.account.writerHead.fetch(writerHeadPda)

      }).then((wh) => {
        return wh.authorized
      }).should.eventually.equal(true);

    });

    step('Able to deauthorize a writer', async function () {
      const [writerHeadPda, _nonce] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint2.toBuffer(), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this

      const metaplex_pda = await Metadata.getPDA(mint2);
      const acts = {
          writerProgram: writerWallet.publicKey,
          creatorProgram: nftCreator2Wallet.publicKey,
          tokenMint: mint2,
          writerHeadPda: writerHeadPda,
          metaplexMetadataPda: metaplex_pda,
        }

      const tx = program.rpc.deauthorizeWriter(
      {
        accounts: acts,
        signers: [nftCreator2Wallet.payer]
      }
      );
      return tx.then(function (tx) {
        // get the pda and verify it's authorized

        return program.account.writerHead.fetch(writerHeadPda)

      }).then((wp)=>{console.log("wp auth", wp.authorized); return wp.authorized}).should.eventually.be.false;

    });
  });
});
