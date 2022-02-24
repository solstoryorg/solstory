import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { RecoilRoot, useSetRecoilState, } from 'recoil';
import { Connection } from "@solana/web3.js";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ProTip from './ProTip';
import { WalletBrowser } from './storiesdisplay';
import { connectionAtom, solstoryProgramAtom } from './state';
import { SolstoryAPI } from '@solstory/api';
//TODO: note to make this an env variable
// const RPC_ENDPOINT_URL = "https://solana-api.projectserum.com"
const RPC_ENDPOINT_URL = "http://localhost:8899";
function Copyright() {
    return (_jsxs(Typography, Object.assign({ variant: "body2", color: "text.secondary", align: "center" }, { children: ['Copyright © ', _jsx(Link, Object.assign({ color: "inherit", href: "https://mui.com/" }, { children: "Your Website" }), void 0), ' ', new Date().getFullYear(), "."] }), void 0));
}
console.log('FUCK');
function GlobalState(props) {
    const setConn = useSetRecoilState(connectionAtom);
    const setSolstoryProgram = useSetRecoilState(solstoryProgramAtom);
    const conn = new Connection(RPC_ENDPOINT_URL);
    console.log('wut', conn);
    React.useEffect(() => {
        setConn(conn);
        const solstoryProgram = new SolstoryAPI({});
        console.log(solstoryProgram);
        setSolstoryProgram(solstoryProgram);
    }, [props]);
    return (_jsx(Container, Object.assign({ maxWidth: "md" }, { children: props.children }), void 0));
}
export default function App() {
    return (_jsx(RecoilRoot, { children: _jsxs(GlobalState, { children: [_jsxs(Box, Object.assign({ sx: { my: 4 } }, { children: [_jsx(Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: "Create React App example with TypeScript" }), void 0), _jsx(ProTip, {}, void 0), _jsx(Copyright, {}, void 0)] }), void 0), _jsx(Box, { children: " " }, void 0), _jsx(Box, { children: _jsx(WalletBrowser, {}, void 0) }, void 0)] }, void 0) }, void 0));
}
