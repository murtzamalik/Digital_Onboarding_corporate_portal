import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f2744', light: '#1e3a5f', dark: '#0a1c30' },
    secondary: { main: '#1565c0' },
    success: { main: '#1b5e20' },
    warning: { main: '#e65100' },
    error: { main: '#b71c1c' },
    background: { default: '#eef1f5', paper: '#ffffff' },
    divider: 'rgba(15, 39, 68, 0.12)',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { variant: 'contained', disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 1px 3px rgba(15, 39, 68, 0.08)' },
      },
    },
  },
})
