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
  const writerKey = Keypair.generate()
  const writerWallet = new NodeWallet(writerKey);

  //pubkey for a malicious user
  const eveKey = Keypair.generate();
  const eveWallet = new NodeWallet(eveKey);


  let mint;


  describe("inner loop to try and keep it from all stopping?", () => {
    // Configure the client to use the local cluster.
    before(async () => {
      console.log('air1', await airdrop(connection, writerKey.publicKey, 3));
      console.log('air2', await airdrop(connection, eveKey.publicKey, 3));
      const nftOwnerWallet = (await getWallet())[0];
      console.log('nft walllettt', nftOwnerWallet);


      const mintNFTArgs: actions.MintNFTParams = {
        connection,
        maxSupply: 1,
        uri: metaplexMetadataURI,
        wallet: nftOwnerWallet,
      }

      const mintResp = await actions.mintNFT(mintNFTArgs);
      mint = mintResp.mint;
      console.log("miiint", mint);


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
        }

      console.log("sending creation tx");
      return program.rpc.createWriterMetadata(
        {
          label: "creation metadata",
          logo: "www.example.com",
          url: "www.example.com",
          cdn: "",
          metadata: ""
        },
      {
        accounts: acts,
        signers: [writerWallet.payer]

      }).then((tx)=>{
      console.log("hashlist test account creation", tx);
      }).then(async () =>{

        console.log('mint is', mint);
      const [_writerHeadPda, _nonce2] = await PublicKey.findProgramAddress(
        // [Buffer.from(anchor.utils.bytes.utf8.encode("solstory"))],
        [Buffer.from(anchor.utils.bytes.utf8.encode("solstory")), mint.toBuffer(), writerWallet.publicKey.toBuffer()],
        program.programId
      ); //TODO: library function for this

      const metaplex_pda = await Metadata.getPDA(mint);
      const writerHeadPda = _writerMetadataPda;
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

      console.log("sending creation tx");
      return program.rpc.createWriterHeadWriter(
      {
        accounts: acts2,
        signers: [writerWallet.payer]

      }).then((tx)=>{
      console.log("hashlist test account creation", tx);
      });
      });

    });

  step('appends an initial record', async () => {
    const fakeData = {
      timestamp:Date.now(),
      prev_hash:"",
      data: {

        msg: "blap"
      }
    }

    const dataContent = JSON.stringify(fakeData.data);

    const dataHasher = crypto.createHash('sha256');
    dataHasher.update(Buffer.from(dataContent, 'utf-8'))
    const dataHash = dataHasher.digest();


    const data = {
      timestamp: new anchor.BN(Date.now()),
      data_hash: dataHash,
      prev_hash: Buffer.from(""),
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
    return tx;
  });

  step('appends a subsequent record', () => {

  });


  });

});

