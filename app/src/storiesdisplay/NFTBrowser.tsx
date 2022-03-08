import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";
import { useState, useEffect } from 'react';
import { atom, useRecoilValue } from 'recoil';
import { popupAtom, solstoryProgramAtom } from '../state';
import { WalletNFTs } from './WalletNFTs';
import { NFTItem } from './NFTItem';


export function NFTBrowser() {
  const [searchPubkey, setSearchPubkey] = useState(undefined);
  const [isError, setIsError] = useState({error: false});
  const popupItem = useRecoilValue(popupAtom);

  const renderNFTItem = () => {
    if(searchPubkey){
      return <NFTItem nft={searchPubkey}/>
    }
  }

  const renderPopup = () =>{

    return popupItem;
  }

  const updateChange = (e)=> {
    console.log("event", e);
    const text = e.target.value;
    if (text.length !== 44) {
      setIsError({error: true});
      setSearchPubkey(undefined);
    } else {
      setIsError({error: false});
      console.log("setting search pubkey!");
      setSearchPubkey(new PublicKey(text));
    }

  }




  //for choosing a wallet
  return (
    <Box>
      <Box>
       <TextField id="wallet-picker" label="NFT Mint Address" {...isError} variant="outlined" onChange={updateChange}/>
      </Box>
      {renderNFTItem()}
      {renderPopup()}
    </Box>
  );
};


