import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { popupAtom } from '../state';
import { useSetRecoilState } from 'recoil';
import { useRef, useEffect } from 'react';
export function NFTPopup(props) {
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
    return (_jsxs(Paper, Object.assign({ ref: wrapperRef, sx: {
            position: 'absolute',
            left: props.x,
            top: props.y,
            padding: 1,
        } }, { children: [_jsxs("h3", { children: [props.metadata.data.data.name, " Stories"] }, void 0), _jsx(Box, { children: _jsx("a", Object.assign({ href: props.extendedMetadata.external_url }, { children: "link" }), void 0) }, void 0)] }), void 0));
}
