import * as React from 'react';
import {
  RecoilRoot,
  atom,
  selector,
  useSetRecoilState,
  useRecoilValue,
} from 'recoil';
import { PublicKey, Keypair, SystemProgram, Connection, TokenAccountsFilter } from "@solana/web3.js";

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import ProTip from './ProTip';
import { WalletBrowser } from './storiesdisplay';
import { connectionAtom, solstoryProgramAtom } from './state';
import { SolstoryAPI } from '@solstory/api';

//TODO: note to make this an env variable
// const RPC_ENDPOINT_URL = "https://solana-api.projectserum.com"
const RPC_ENDPOINT_URL = "http://localhost:8899"

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}

console.log('FUCK');
function GlobalState (props) {
  const setConn = useSetRecoilState(connectionAtom)
  const setSolstoryProgram = useSetRecoilState(solstoryProgramAtom)
  const conn = new Connection(RPC_ENDPOINT_URL);
  console.log('wut', conn);
  React.useEffect(() =>{
    setConn(conn);
    const solstoryProgram = new SolstoryAPI({});
    console.log(solstoryProgram);
    setSolstoryProgram(solstoryProgram)
  },[props])
  return (
    <Container maxWidth="md">
      {props.children}
    </Container>
  );

}
export default function App() {
  return (
    <RecoilRoot>
        <GlobalState>
          <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Create React App example with TypeScript
            </Typography>
            <ProTip />
            <Copyright />
          </Box>
          <Box> {/*divider*/}
          </Box>
          <Box>{/*main */}
            <WalletBrowser />
          </Box>
        </GlobalState>
    </RecoilRoot>
  );
}



