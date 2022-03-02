import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo } from 'react';
import { RecoilRoot, useSetRecoilState, } from 'recoil';
import { Connection } from "@solana/web3.js";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ProTip from './ProTip';
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';
import { useWallet, useAnchorWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, TorusWalletAdapter, } from '@solana/wallet-adapter-wallets';
import { Provider } from '@project-serum/anchor';
import { useSnackbar } from 'notistack';
import { connectionAtom, solstoryProgramAtom } from './state';
import { TabContainer } from './TabContainer';
//hackathon bullshit because of es6 commonjs stuff
import solstory from '@solstory/api';
const { SolstoryAPI } = solstory;
console.log('bla2', SolstoryAPI);
//TODO: note to make this an env variable
// const RPC_ENDPOINT_URL = "https://solana-api.projectserum.com"
const RPC_ENDPOINT_URL = "http://localhost:8899";
function Copyright() {
    return (_jsxs(Typography, Object.assign({ variant: "body2", color: "text.secondary", align: "center" }, { children: ['Copyright © ', _jsx(Link, Object.assign({ color: "inherit", href: "https://mui.com/" }, { children: "Your Website" }), void 0), ' ', new Date().getFullYear(), ". Rocket from ", _jsx(Link, Object.assign({ href: "https://iconduck.com/icons/49302/rocket" }, { children: "Iconduck" }), void 0)] }), void 0));
}
function GlobalState(props) {
    const setConn = useSetRecoilState(connectionAtom);
    const setSolstoryProgram = useSetRecoilState(solstoryProgramAtom);
    const conn = new Connection(RPC_ENDPOINT_URL);
    const wallet = useAnchorWallet();
    useEffect(() => {
        const endpoint = RPC_ENDPOINT_URL;
        setConn(conn);
        // const solstoryProgram = new SolstoryAPI({}, new Provider(conn, emptyWallet, {}) );
        // console.log(solstoryProgram);
        // setSolstoryProgram(solstoryProgram)
    }, [props]);
    //Stuff for solana wallets
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SlopeWalletAdapter(),
        // new SolflareWalletAdapter({ network }),
        new TorusWalletAdapter(),
        new LedgerWalletAdapter(),
        // new SolletWalletAdapter({ network }),
        // new SolletExtensionWalletAdapter({ network }),
    ], [props]
    // [network]
    );
    const { enqueueSnackbar } = useSnackbar();
    const onError = useCallback((error) => {
        enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
        console.error(error);
    }, [enqueueSnackbar]);
    return (_jsx(WalletProvider, Object.assign({ wallets: wallets, onError: onError, autoConnect: true }, { children: _jsx(WalletDialogProvider, { children: props.children }, void 0) }), void 0));
}
const Content = () => {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();
    const setSolstoryProgram = useSetRecoilState(solstoryProgramAtom);
    useEffect(() => {
        if (anchorWallet === undefined) {
            console.log("undefined wallet, aborting");
            return;
        }
        console.log("attmepting to create provider");
        const conn = new Connection(RPC_ENDPOINT_URL);
        console.log("wow we skipped it");
        const solstoryProgram = new SolstoryAPI({}, new Provider(conn, anchorWallet, {}));
        console.log(solstoryProgram);
        setSolstoryProgram(solstoryProgram);
    }, [publicKey]);
    return (_jsxs(Container, Object.assign({ maxWidth: "md" }, { children: [_jsxs(Box, Object.assign({ sx: { my: 4 } }, { children: [_jsx(Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: "Create React App example with TypeScript" }), void 0), _jsx(ProTip, {}, void 0)] }), void 0), _jsx(Box, Object.assign({ sx: { display: "flex", justifyContent: "center", margin: 4 } }, { children: _jsx(WalletMultiButton, {}, void 0) }), void 0), _jsx(Box, { children: " " }, void 0), _jsx(Box, { children: _jsx(TabContainer, {}, void 0) }, void 0), _jsx(Box, Object.assign({ sx: { margin: 2 } }, { children: _jsx(Copyright, {}, void 0) }), void 0)] }), void 0));
};
export default function App() {
    return (_jsx(RecoilRoot, { children: _jsx(GlobalState, { children: _jsx(Content, {}, void 0) }, void 0) }, void 0));
}
