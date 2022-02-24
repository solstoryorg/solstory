import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import Grid from '@mui/material/Grid';
import {utils} from '@metaplex/js';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";
import { connectionAtom, popupAtom } from '../state';
import { atom, useRecoilValue, useSetRecoilState } from 'recoil';
import {NFTPopup } from './NFTPopup';

import { useState, useEffect } from 'react';
/*
 * This one sets up NFT display, which includes the popup
 * NFTPopup displaying all the attached programs.
 */
export function NFTItem(props: {nft: any}) {
  const [metadata, setMetadata] = useState(undefined);
  const [extendedMetadata, setExtendedMetadata] = useState(undefined);
  const connection: Connection = useRecoilValue(connectionAtom);
  const setNFTPopup = useSetRecoilState(popupAtom);

  useEffect(() => {
    Metadata.getPDA(props.nft).
      then((metadata_pda) => {
            return Metadata.load(connection, metadata_pda)

    }).then((metadata)=>{
      console.log("got metadata", metadata);
      utils.metadata.lookup(metadata.data.data.uri)
      .then((output)=>{
        console.log(output)
        setExtendedMetadata(output)
      });
      setMetadata(metadata)


    });
  }, [props.nft]);

  const popup = (event) => {
    console.log("event actual", event);
    setNFTPopup(<NFTPopup metadata={metadata} extendedMetadata={extendedMetadata} x={event.pageX} y={event.pageY} />);
  }

  const renderExtMetadata = (extMetadata) => {
    if (extMetadata == undefined)
      return 'spinny';
    return (
      <Box >
        <Paper sx={{display: 'flex', aspectRatio: 1.0, height:1.0}} onClick={(e)=>popup(e)} title={extMetadata.description}>
          <Box sx={{display: 'inline-flex', maxWidth:0.3, m:1}} component="img" src={extMetadata.image}/>
          <Box sx={{display: 'inline-flex', maxWidth:0.7, m:1}}>
        <h3>{extMetadata.name}</h3>

          </Box>
        </Paper>

        </Box>
    )

  }


  console.log(props.nft);
  return (
    <Grid item xs={12} sm={6} md={4} sx={{
      }}>
      <Box>
    { renderExtMetadata(extendedMetadata) }
  </Box>
    </Grid>
  )
}


