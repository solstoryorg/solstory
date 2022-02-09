"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Container_1 = __importDefault(require("@mui/material/Container"));
const Typography_1 = __importDefault(require("@mui/material/Typography"));
const Box_1 = __importDefault(require("@mui/material/Box"));
const Link_1 = __importDefault(require("@mui/material/Link"));
const ProTip_1 = __importDefault(require("./ProTip"));
function Copyright() {
    return ((0, jsx_runtime_1.jsxs)(Typography_1.default, Object.assign({ variant: "body2", color: "text.secondary", align: "center" }, { children: ['Copyright © ', (0, jsx_runtime_1.jsx)(Link_1.default, Object.assign({ color: "inherit", href: "https://mui.com/" }, { children: "Your Website" }), void 0), ' ', new Date().getFullYear(), "."] }), void 0));
}
function App() {
    return ((0, jsx_runtime_1.jsx)(Container_1.default, Object.assign({ maxWidth: "sm" }, { children: (0, jsx_runtime_1.jsxs)(Box_1.default, Object.assign({ sx: { my: 4 } }, { children: [(0, jsx_runtime_1.jsx)(Typography_1.default, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: "Create React App example with TypeScript" }), void 0), (0, jsx_runtime_1.jsx)(ProTip_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(Copyright, {}, void 0)] }), void 0) }), void 0));
}
exports.default = App;
