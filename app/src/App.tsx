import { useCallback, useEffect, useMemo } from 'react';
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

import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';
import { useWallet, useAnchorWallet, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { Provider } from '@project-serum/anchor';

import { useSnackbar } from 'notistack';

import { WalletBrowser } from './storiesdisplay';
import { connectionAtom, solstoryProgramAtom } from './state';


//hackathon bullshit because of es6 commonjs stuff
import * as Solstory from '@solstory/api';
const { SolstoryAPI } = Solstory.default;
console.log('bla2', SolstoryAPI);

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

function GlobalState (props) {
  const setConn = useSetRecoilState(connectionAtom)
  const setSolstoryProgram = useSetRecoilState(solstoryProgramAtom)
  const conn = new Connection(RPC_ENDPOINT_URL);
  const wallet = useAnchorWallet();
  useEffect(() =>{
    const endpoint = RPC_ENDPOINT_URL
    setConn(conn);
    // const solstoryProgram = new SolstoryAPI({}, new Provider(conn, emptyWallet, {}) );
    // console.log(solstoryProgram);
    // setSolstoryProgram(solstoryProgram)
  },[props])

  //Stuff for solana wallets
      const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SlopeWalletAdapter(),
            // new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            // new SolletWalletAdapter({ network }),
            // new SolletExtensionWalletAdapter({ network }),
        ],
        [props]
        // [network]
    );

        const { enqueueSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );
  return (
      <WalletProvider wallets={wallets} onError={ onError } autoConnect>
          <WalletDialogProvider>
            {props.children}
          </WalletDialogProvider>
      </WalletProvider>
  );

}

const Content = () => {
  const { publicKey }= useWallet();
  const anchorWallet = useAnchorWallet();
  const setSolstoryProgram = useSetRecoilState(solstoryProgramAtom);
  useEffect(() => {
    if(anchorWallet === undefined){
      console.log("undefined wallet, aborting");
      return;
    }
    console.log("attmepting to create provider")
    const conn = new Connection(RPC_ENDPOINT_URL);
    console.log("wow we skipped it")
    const solstoryProgram = new SolstoryAPI({}, new Provider(conn, anchorWallet, {}) );
    console.log(solstoryProgram);
    setSolstoryProgram(solstoryProgram);

  },
     [publicKey])
  return (
    <Container maxWidth="md">

          <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Create React App example with TypeScript
            </Typography>
            <ProTip />
          </Box>
          <Box sx={{display: "flex", justifyContent: "center", margin:4}}>
              <WalletMultiButton />
          </Box>
          <Box> {/*divider*/}
          </Box>
          <Box>{/*main */}
            <WalletBrowser />
          </Box>
          <Box sx={{margin:2}}>
            <Copyright />
        </Box>
    </Container>
  );
}
export default function App() {
  return (
    <RecoilRoot>
        <GlobalState>
          <Content/>
        </GlobalState>
    </RecoilRoot>
  );
}



