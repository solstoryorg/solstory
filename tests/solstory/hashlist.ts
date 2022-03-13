import * as anchor from '@project-serum/anchor';
import { Program, BN, IdlAccounts } from '@project-serum/anchor';
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { Solstory } from '../../target/types/solstory';
import { airdrop, LOCALHOST } from '@metaplex-foundation/amman';
import { NodeWallet, Connection, actions} from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { getWallet } from '../utils/mockMetaplex';
import { step, xstep } from 'mocha-steps';
import * as crypto from 'crypto';

import { timestampToBytes, solstoryHash } from '../../api/src/utils/index';

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const should = chai.should();
chai.use(chaiAsPromised);

//metadata uri from metaplex's own NFT minting test
const metaplexMetadataURI =
  'https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link';

describe('solstory hashlist test', async () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Solstory as Program<Solstory>;
  const connection = new Connection(LOCALHOST, 'confirmed');


  //pubkey for the writer program!
  const writerKey = Keypair.fromSeed(Uint8Array.from('00200000000044440000000000000001'))
  const writerWallet = new NodeWallet(writerKey);

  //pubkey for a malicious user
  const eveKey = Keypair.fromSeed(Uint8Array.from('00200000000044440000000000000002'))
  const eveWallet = new NodeWallet(eveKey);


  let mint;


  describe("inner loop to try and keep it from all stopping?", () => {
    // Configure the client to use the local cluster.
    before(async () => {
      console.log('hashlist1', await airdrop(connection, writerKey.publicKey, 3));
      console.log('hashlist 2', await airdrop(connection, eveKey.publicKey, 3));
      const nftOwnerWallet = (await getWallet('hashlist'))[0];
      console.log('hashlist NFT wallet', nftOwnerWallet.publicKey);


      const mintNFTArgs: actions.MintNFTParams = {
        connection,
        maxSupply: 1,
        uri: metaplexMetadataURI,
        wallet: nftOwnerWallet,
      }

      const mintResp = await actions.mintNFT(mintNFTArgs);
      mint = mintResp.mint;
      console.log("hashlist NFT mint", mint);
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
      } catch(e) {
      console.warn("init failed with ", e);
      }


      const [_writerMetadataPda, _nonce] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this

      const writerMetadataPda = _writerMetadataPda;
      const acts = {
          writerProgram: writerWallet.publicKey,
          ownerProgram: nftOwnerWallet.publicKey,
          writerMetadataPda: writerMetadataPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          solstoryPda: solstoryPda,
        }

      return program.rpc.createWriterMetadata(
        {
          label: "creation metadata",
          description: "this is a metadata description",
          logo: "www.example.com",
          url: "www.example.com",
          cdn: "",
          metadata: ""
        },
      {
        accounts: acts,
        signers: [writerWallet.payer]

      }).then((tx)=>{
      console.log("hashlist test writermeta creation", tx);
      }).then(async () =>{

      const [_writerHeadPda, _nonce2] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this

      const metaplex_pda = await Metadata.getPDA(mint);
      const writerHeadPda = _writerHeadPda;
      const acts2 = {
          writerProgram: writerWallet.publicKey,
          ownerProgram: nftOwnerWallet.publicKey,
          tokenMint: mint,
          writerMetadataPda: writerMetadataPda,
          writerHeadPda: writerHeadPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          metaplexMetadataPda: metaplex_pda,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }

      return program.rpc.createWriterHeadWriter(
      {
        accounts: acts2,
        signers: [writerWallet.payer]

      }).then((tx)=>{
      console.log("hashlist test writerhead creation", tx);
      });
      });

    });

  step('appends an initial record', async () => {
    const fakeData = {
      timestamp: new anchor.BN(Date.now()),
      prev_hash:"",
      data: {

        msg: "blap"
      }
    }

    const dataContent = JSON.stringify(fakeData.data);

    const dataHasher = crypto.createHash('sha256');
    dataHasher.update(Buffer.from(dataContent, 'utf-8'))
    const dataHash = Uint8Array.from(dataHasher.digest());


    const timestamp = new anchor.BN(Math.floor(Date.now()/1000));
    const oldHash = new Uint8Array(32).fill(0);
    const newHash = solstoryHash(timestamp, dataHash, oldHash);

    const data = {
      timestamp: timestamp,
      dataHash: dataHash,
      prevHash: oldHash,
      newHash: newHash,
      objId: Uint8Array.from(Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex")),
      accessType: {ardrive:{}},
      // accessType: JSON.stringify({ ardrive: {}})
      // accessType: {ardrive:{}},
    }

    const [_writerHeadPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this

    const writerHeadPda = _writerHeadPda;
    const acts = {
        writerProgram: writerWallet.publicKey,
        tokenMint: mint,
        writerHeadPda: writerHeadPda,
      };
    const tx = program.rpc.extAppend(data,
     {
       accounts: acts,
       signers: [writerWallet.payer],
     });
    return tx.then((tx) => {
      return program.account.writerHead.fetch(writerHeadPda)
    }).then((wh) => {
      return wh.currentHash == newHash;
    });
  });


  step('appends a subsequent record', async () => {
    const [_writerHeadPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this
    const writerHeadPda = _writerHeadPda;

    const fakeData = {
      data: 'more fake data',
    }

    const dataContent = JSON.stringify(fakeData.data);

    const dataHasher = crypto.createHash('sha256');
    dataHasher.update(Buffer.from(dataContent, 'utf-8'))
    const dataHash = dataHasher.digest();
    const timestamp = new anchor.BN(Math.floor(Date.now()/1000));

    return program.account.writerHead.fetch(writerHeadPda).
      then((wh) => {

        const prevHash = wh.currentHash;
        const newHash = solstoryHash(timestamp, dataHash, Buffer.from(prevHash));

        const data = {
          timestamp: timestamp,
          dataHash: dataHash,
          prevHash: Buffer.from(prevHash),
          objId: Uint8Array.from(Buffer.from("1111111111111111111111111111111111111111111111111111111111111112", "hex")),
          newHash: newHash,
          accessType: {ardrive:{}},
        }

        const acts = {
            writerProgram: writerWallet.publicKey,
            tokenMint: mint,
            writerHeadPda: writerHeadPda,
          };
        const tx = program.rpc.extAppend(data,
         {
           accounts: acts,
           signers: [writerWallet.payer],
         });
        return tx.then((tx) => {
          return program.account.writerHead.fetch(writerHeadPda)
        }).then((wh) => {
          return wh.currentHash == newHash;
        });
      });
  });

  step('fails to append an incorrect hash', async () => {
    const [_writerHeadPda, _nonce] = await PublicKey.findProgramAddress(
      // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
      [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
      program.programId
    ); //TODO: library function for this
    const writerHeadPda = _writerHeadPda;

    const fakeData = {
      data: 'more fake data aa',
    }

    const dataContent = JSON.stringify(fakeData.data);

    const dataHasher = crypto.createHash('sha256');
    dataHasher.update(Buffer.from(dataContent, 'utf-8'))
    const dataHash = dataHasher.digest();
    const timestamp = new anchor.BN(Math.floor(Date.now()/1000));

    return program.account.writerHead.fetch(writerHeadPda).
      then((wh) => {

        // lie about the previous hash, in an attempt to redirect the chain
        const prevHash = dataHash;
        const newHash = solstoryHash(timestamp, dataHash, Buffer.from(prevHash));

        const data = {
          timestamp: timestamp,
          dataHash: dataHash,
          prevHash: Buffer.from(prevHash),
          objId: Uint8Array.from(Buffer.from("1111111111111111111111111111111111111111111111111111111111111112", "hex")),
          newHash: newHash,
          accessType: {ardrive:{}},
        }

        const acts = {
            writerProgram: writerWallet.publicKey,
            tokenMint: mint,
            writerHeadPda: writerHeadPda,
          };
        const tx = program.rpc.extAppend(data,
         {
           accounts: acts,
           signers: [writerWallet.payer],
         });
        return tx.then((tx) => {
          return program.account.writerHead.fetch(writerHeadPda)
        }).then((wh) => {
          return wh.currentHash == newHash;
        });
      });
  });



  });


});

