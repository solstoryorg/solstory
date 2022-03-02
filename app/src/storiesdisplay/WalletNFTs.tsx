import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";
import { Wallet } from '@project-serum/anchor';
import { atom, useRecoilValue } from 'recoil';
import { NFTItem } from './NFTItem';
import { TOKEN_PROGRAM_KEY } from '../utils';
import { useState, useEffect } from 'react';
import { connectionAtom, solstoryProgramAtom } from '../state';

export function WalletNFTs(props: {pubkey: PublicKey}) {

      const connection: Connection = useRecoilValue(connectionAtom);
      const solstoryProgram = useRecoilValue(solstoryProgramAtom);
      let [nfts, setNfts] = useState([]);
      console.log(connection);

      const getNFTs = function(ownerAddress){
            if (connection == undefined)
                  return;
            connection.getParsedTokenAccountsByOwner(ownerAddress, {programId: TOKEN_PROGRAM_KEY})
                  .then((resp_and_ctx) => {
                        console.log("token get ctx", resp_and_ctx.context);
                        console.log("token get val", resp_and_ctx.value);
                        setNfts(resp_and_ctx.value.slice(0, 5).filter((item)=>{console.log(item.account.data.parsed.info.tokenAmount.amount); return item.account.data.parsed.info.tokenAmount.amount <= 1.0})
                                .map((item, i) => { console.log("mint?", item.account.data.parsed.info.mint); return item.account.data.parsed.info.mint}));
                        console.log('nfts', nfts)
                  })
      };
      useEffect(() => {getNFTs(props.pubkey)}, [props.pubkey]);


      return (
            <Grid container direction="row" spacing={2}>
            {nfts.map((nft, index) => {return (
              <NFTItem nft={nft} />
            )})}
      </Grid>
      )

}
