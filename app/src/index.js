"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_dom_1 = __importDefault(require("react-dom"));
const CssBaseline_1 = __importDefault(require("@mui/material/CssBaseline"));
const styles_1 = require("@mui/material/styles");
const App_1 = __importDefault(require("./App"));
const theme_1 = __importDefault(require("./theme"));
react_dom_1.default.render((0, jsx_runtime_1.jsxs)(styles_1.ThemeProvider, Object.assign({ theme: theme_1.default }, { children: [(0, jsx_runtime_1.jsx)(CssBaseline_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(App_1.default, {}, void 0)] }), void 0), document.querySelector('#root'));
