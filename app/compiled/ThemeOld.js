import { jsx as _jsx } from "react/jsx-runtime";
import { StyledEngineProvider, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { SnackbarProvider } from 'notistack';
// A custom theme for this app
const theme = createTheme({
    palette: {
        primary: {
            main: '#556cd6',
        },
        secondary: {
            main: '#19857b',
        },
        error: {
            main: red.A400,
        },
    },
});
export const Theme = ({ children }) => {
    return (_jsx(StyledEngineProvider, Object.assign({ injectFirst: true }, { children: _jsx(ThemeProvider, Object.assign({ theme: theme }, { children: _jsx(SnackbarProvider, { children: children }, void 0) }), void 0) }), void 0));
};
