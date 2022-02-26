import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { WalletNFTs } from './WalletNFTs';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";
import { useState, useEffect } from 'react';
import { popupAtom } from '../state';
import { atom, useRecoilValue } from 'recoil';


const TMP_TEST_KEY = new PublicKey('CYfwu9BtsSCnUqtxt72gujfr4j2WWiimPd5y9tM34CwP');
export function WalletBrowser() {
  var f = 'f';
  const [searchPubkey, setSearchPubkey] = useState(TMP_TEST_KEY);
  const [isError, setIsError] = useState({error: false});
  const popupItem = useRecoilValue(popupAtom);

  const renderPopup = () =>{
    return popupItem;
  }

  const updateChange = (e)=> {
    console.log("event", e);
    const text = e.target.value;
    if (text.length !== 44) {
      setIsError({error: true});
    } else {
      setIsError({error: false});
      setSearchPubkey(new PublicKey(text));
    }

  }




  //for choosing a wallet
  return (
    <Box>
      <Box>
       <TextField id="wallet-picker" label="Wallet Address" {...isError} variant="outlined" onChange={updateChange}/>
      </Box>
      <WalletNFTs pubkey={searchPubkey}/>
      {renderPopup()}
    </Box>
  );
};

