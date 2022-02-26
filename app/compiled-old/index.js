import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ReactDOM from 'react-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import { SnackbarProvider } from 'notistack';
ReactDOM.render(_jsx(StyledEngineProvider, Object.assign({ injectFirst: true }, { children: _jsxs(ThemeProvider, Object.assign({ theme: theme }, { children: [_jsx(CssBaseline, {}, void 0), _jsx(SnackbarProvider, { children: _jsx(App, {}, void 0) }, void 0)] }), void 0) }), void 0), document.querySelector('#root'));
