import { StyledEngineProvider, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { SnackbarProvider } from 'notistack';
import React from 'react';


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
    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <SnackbarProvider>{children}</SnackbarProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};
