import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { WalletNFTs } from './WalletNFTs';
import { PublicKey } from "@solana/web3.js";
import { useState } from 'react';
import { popupAtom, solstoryProgramAtom } from '../state';
import { useRecoilValue } from 'recoil';
const TMP_TEST_KEY = new PublicKey('CYfwu9BtsSCnUqtxt72gujfr4j2WWiimPd5y9tM34CwP');
export function WalletBrowser() {
    var f = 'f';
    const [searchPubkey, setSearchPubkey] = useState(TMP_TEST_KEY);
    const [isError, setIsError] = useState({ error: false });
    const popupItem = useRecoilValue(popupAtom);
    // const wallet = useAnchorWallet();
    const solstoryProgram = useRecoilValue(solstoryProgramAtom);
    const renderPopup = () => {
        return popupItem;
    };
    const updateChange = (e) => {
        console.log("event", e);
        const text = e.target.value;
        if (text.length !== 44) {
            setIsError({ error: true });
        }
        else {
            setIsError({ error: false });
            setSearchPubkey(new PublicKey(text));
        }
    };
    //for choosing a wallet
    return (_jsxs(Box, { children: [_jsx(Box, { children: _jsx(TextField, Object.assign({ id: "wallet-picker", label: "Wallet Address" }, isError, { variant: "outlined", onChange: updateChange }), void 0) }, void 0), _jsx(WalletNFTs, { pubkey: searchPubkey }, void 0), renderPopup()] }, void 0));
}
;
