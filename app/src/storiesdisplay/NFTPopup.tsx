import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import Grid from '@mui/material/Grid';
import {utils} from '@metaplex/js';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";
import { connectionAtom, popupAtom } from '../state';
import { atom, useRecoilValue, useSetRecoilState } from 'recoil';

import { useRef, useState, useEffect } from 'react';

export function NFTPopup(props: {metadata: any, extendedMetadata: any, x: number, y: number}) {

  // Shamelessly from: https://stackoverflow.com/questions/32553158/detect-click-outside-react-component
  /**
   * Hook that alerts clicks outside of the passed ref
   */
  function useOutsideAlerter(ref) {
    const setPopup = useSetRecoilState(popupAtom);
      useEffect(() => {
          /**
           * Alert if clicked on outside of element
           */
          console.log("stories met", props.metadata);
          console.log("stories ext met", props.extendedMetadata);
          function handleClickOutside(event) {
              if (ref.current && !ref.current.contains(event.target)) {
                  console.log("You clicked outside of me!");
                  setPopup(null);
              }
          }

          // Bind the event listener
          document.addEventListener("mousedown", handleClickOutside);
          return () => {
              // Unbind the event listener on clean up
              document.removeEventListener("mousedown", handleClickOutside);
          };
      }, [ref]);
  }

  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef);
  return (

    <Paper ref={wrapperRef} sx= {{

      position: 'absolute',
      left: props.x,
      top: props.y,
      padding: 1,
      }}>
      <h3>{props.metadata.data.data.name} Stories</h3>
      <Box>
      <a href={props.extendedMetadata.external_url}>link</a>

      </Box>
    </Paper>
  );
}
