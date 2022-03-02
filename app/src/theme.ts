import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { red } from '@mui/material/colors';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    code: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    code?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    code: true;
  }
}


// A custom theme for this app
let theme = createTheme({
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

theme = createTheme(theme, {
  typography: {
    code: theme.typography.body1
  }
});
theme = createTheme(theme, {
  typography: {
    code:
      {
      fontFamily: "Roboto Mono",
    }
  }
});

theme = responsiveFontSizes(theme);

export default theme;
