import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import Grid from '@mui/material/Grid';
import { utils } from '@metaplex/js';
import { connectionAtom, popupAtom } from '../state';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { NFTPopup } from './NFTPopup';
import { useState, useEffect } from 'react';
/*
 * This one sets up NFT display, which includes the popup
 * NFTPopup displaying all the attached programs.
 */
export function NFTItem(props) {
    const [metadata, setMetadata] = useState(undefined);
    const [extendedMetadata, setExtendedMetadata] = useState(undefined);
    const connection = useRecoilValue(connectionAtom);
    const setNFTPopup = useSetRecoilState(popupAtom);
    useEffect(() => {
        Metadata.getPDA(props.nft).
            then((metadata_pda) => {
            return Metadata.load(connection, metadata_pda);
        }).then((metadata) => {
            console.log("got metadata", metadata);
            utils.metadata.lookup(metadata.data.data.uri)
                .then((output) => {
                console.log(output);
                setExtendedMetadata(output);
            });
            setMetadata(metadata);
        });
    }, [props.nft]);
    const popup = (event) => {
        console.log("event actual", event);
        setNFTPopup(_jsx(NFTPopup, { metadata: metadata, extendedMetadata: extendedMetadata, x: event.pageX, y: event.pageY }, void 0));
    };
    const renderExtMetadata = (extMetadata) => {
        if (extMetadata == undefined)
            return 'spinny';
        return (_jsx(Box, { children: _jsxs(Paper, Object.assign({ sx: { display: 'flex', aspectRatio: 1.0, height: 1.0, cursor: "pointer" }, onClick: (e) => popup(e), title: extMetadata.description }, { children: [_jsx(Box, { sx: { display: 'inline-flex', maxWidth: 0.3, m: 1 }, component: "img", src: extMetadata.image }, void 0), _jsx(Box, Object.assign({ sx: { display: 'inline-flex', maxWidth: 0.7, m: 1 } }, { children: _jsx("h3", { children: extMetadata.name }, void 0) }), void 0)] }), void 0) }, void 0));
    };
    console.log(props.nft);
    return (_jsx(Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, sx: {} }, { children: _jsx(Box, { children: renderExtMetadata(extendedMetadata) }, void 0) }), void 0));
}
