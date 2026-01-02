import { ThemeOptions } from '@mui/material/styles';
import { ComponentsOverrides } from '@mui/material/styles';

export function getBaseTheme(): ThemeOptions {
  return {
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            padding: '8px 24px',
            textTransform: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          },
        } as ComponentsOverrides['MuiButton'],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
          },
        } as ComponentsOverrides['MuiCard'],
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          },
        } as ComponentsOverrides['MuiTextField'],
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
          },
          switchBase: {
            padding: '0 6px',
          },
          thumb: {
            width: 20,
            height: 20,
          },
        } as ComponentsOverrides['MuiSwitch'],
      },
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
  };
}
