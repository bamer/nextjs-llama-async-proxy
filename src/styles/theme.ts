// src/styles/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

// Design Tokens - Système de design moderne
const designTokens = {
  colors: {
    primary: {
      50: '#f0f7ff',
      100: '#e0f0fe',
      200: '#b9e0fe',
      300: '#7ccbfd',
      400: '#36b4fc',
      500: '#0d9ef8',
      600: '#0a7fd6',
      700: '#0866b3',
      800: '#075290',
      900: '#064474',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
  },
};

// Base Theme Configuration
const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    overline: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
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
      },
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
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
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
      },
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

// Light Theme
const lightTheme = createTheme(
  deepmerge(baseTheme, {
    palette: {
      mode: 'light',
      primary: {
        main: designTokens.colors.primary[500],
        light: designTokens.colors.primary[300],
        dark: designTokens.colors.primary[700],
        contrastText: '#ffffff',
      },
      secondary: {
        main: designTokens.colors.secondary[500],
        light: designTokens.colors.secondary[300],
        dark: designTokens.colors.secondary[700],
        contrastText: '#ffffff',
      },
      success: {
        main: designTokens.colors.success[500],
        light: designTokens.colors.success[300],
        dark: designTokens.colors.success[700],
        contrastText: '#ffffff',
      },
      warning: {
        main: designTokens.colors.warning[500],
        light: designTokens.colors.warning[300],
        dark: designTokens.colors.warning[700],
        contrastText: '#ffffff',
      },
      error: {
        main: designTokens.colors.error[500],
        light: designTokens.colors.error[300],
        dark: designTokens.colors.error[700],
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
        disabled: '#94a3b8',
      },
      divider: 'rgba(0, 0, 0, 0.08)',
      action: {
        active: 'rgba(0, 0, 0, 0.54)',
        hover: 'rgba(0, 0, 0, 0.04)',
        selected: 'rgba(0, 0, 0, 0.08)',
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: 'rgba(0, 0, 0, 0.12)',
      },
    },
  })
);

// Dark Theme
const darkTheme = createTheme(
  deepmerge(baseTheme, {
    palette: {
      mode: 'dark',
      primary: {
        main: designTokens.colors.primary[400],
        light: designTokens.colors.primary[300],
        dark: designTokens.colors.primary[600],
        contrastText: '#ffffff',
      },
      secondary: {
        main: designTokens.colors.secondary[400],
        light: designTokens.colors.secondary[300],
        dark: designTokens.colors.secondary[600],
        contrastText: '#ffffff',
      },
      success: {
        main: designTokens.colors.success[400],
        light: designTokens.colors.success[300],
        dark: designTokens.colors.success[600],
        contrastText: '#ffffff',
      },
      warning: {
        main: designTokens.colors.warning[400],
        light: designTokens.colors.warning[300],
        dark: designTokens.colors.warning[600],
        contrastText: '#ffffff',
      },
      error: {
        main: designTokens.colors.error[400],
        light: designTokens.colors.error[300],
        dark: designTokens.colors.error[600],
        contrastText: '#ffffff',
      },
      background: {
        default: '#0f172a',
        paper: '#1e293b',
      },
      text: {
        primary: '#f1f5f9',
        secondary: '#cbd5e1',
        disabled: '#94a3b8',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
      action: {
        active: 'rgba(255, 255, 255, 0.54)',
        hover: 'rgba(255, 255, 255, 0.04)',
        selected: 'rgba(255, 255, 255, 0.08)',
        disabled: 'rgba(255, 255, 255, 0.26)',
        disabledBackground: 'rgba(255, 255, 255, 0.12)',
      },
    },
  })
);

export { lightTheme, darkTheme, designTokens };
export type { ThemeOptions };

export default {
  lightTheme,
  darkTheme,
  designTokens,
};
