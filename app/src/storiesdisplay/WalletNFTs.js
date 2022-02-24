import { jsx as _jsx } from "react/jsx-runtime";
import Grid from '@mui/material/Grid';
import { useRecoilValue } from 'recoil';
import { NFTItem } from './NFTItem';
import { TOKEN_PROGRAM_KEY } from '../utils';
import { useState, useEffect } from 'react';
import { connectionAtom } from '../state';
export function WalletNFTs(props) {
    const connection = useRecoilValue(connectionAtom);
    let [nfts, setNfts] = useState([]);
    console.log(connection);
    const getNFTs = function (ownerAddress) {
        if (connection == undefined)
            return;
        connection.getParsedTokenAccountsByOwner(ownerAddress, { programId: TOKEN_PROGRAM_KEY })
            .then((resp_and_ctx) => {
            console.log("token get ctx", resp_and_ctx.context);
            console.log("token get val", resp_and_ctx.value);
            setNfts(resp_and_ctx.value.slice(0, 5).filter((item) => { console.log(item.account.data.parsed.info.tokenAmount.amount); return item.account.data.parsed.info.tokenAmount.amount <= 1.0; })
                .map((item, i) => { console.log("mint?", item.account.data.parsed.info.mint); return item.account.data.parsed.info.mint; }));
            console.log('nfts', nfts);
        });
    };
    useEffect(() => { getNFTs(props.pubkey); }, [props.pubkey]);
    return (_jsx(Grid, Object.assign({ container: true, spacing: 2 }, { children: nfts.map((nft, index) => {
            return (_jsx(NFTItem, { nft: nft }, void 0));
        }) }), void 0));
}
