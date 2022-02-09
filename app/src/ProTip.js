"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Link_1 = __importDefault(require("@mui/material/Link"));
const SvgIcon_1 = __importDefault(require("@mui/material/SvgIcon"));
const Typography_1 = __importDefault(require("@mui/material/Typography"));
function LightBulbIcon(props) {
    return ((0, jsx_runtime_1.jsx)(SvgIcon_1.default, Object.assign({}, props, { children: (0, jsx_runtime_1.jsx)("path", { d: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" }, void 0) }), void 0));
}
function ProTip() {
    return ((0, jsx_runtime_1.jsxs)(Typography_1.default, Object.assign({ sx: { mt: 6, mb: 3 }, color: "text.secondary" }, { children: [(0, jsx_runtime_1.jsx)(LightBulbIcon, { sx: { mr: 1, verticalAlign: 'middle' } }, void 0), "Pro tip: See more ", (0, jsx_runtime_1.jsx)(Link_1.default, Object.assign({ href: "https://mui.com/getting-started/templates/" }, { children: "templates" }), void 0), " on the MUI documentation."] }), void 0));
}
exports.default = ProTip;
