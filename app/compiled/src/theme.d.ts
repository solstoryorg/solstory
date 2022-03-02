/// <reference types="react" />
declare module '@mui/material/styles' {
    interface TypographyVariants {
        code: React.CSSProperties;
    }
    interface TypographyVariantsOptions {
        code?: React.CSSProperties;
    }
}
declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        code: true;
    }
}
declare let theme: import("@mui/material/styles").Theme;
export default theme;
//# sourceMappingURL=theme.d.ts.map