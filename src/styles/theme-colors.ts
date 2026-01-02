import { PaletteOptions } from '@mui/material/styles';

export const designColors = {
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
};

export const designShadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
};

export function getLightPalette(): PaletteOptions {
  return {
    mode: 'light',
    primary: {
      main: designColors.primary[500],
      light: designColors.primary[300],
      dark: designColors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designColors.secondary[500],
      light: designColors.secondary[300],
      dark: designColors.secondary[700],
      contrastText: '#ffffff',
    },
    success: {
      main: designColors.success[500],
      light: designColors.success[300],
      dark: designColors.success[700],
      contrastText: '#ffffff',
    },
    warning: {
      main: designColors.warning[500],
      light: designColors.warning[300],
      dark: designColors.warning[700],
      contrastText: '#ffffff',
    },
    error: {
      main: designColors.error[500],
      light: designColors.error[300],
      dark: designColors.error[700],
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
  };
}

export function getDarkPalette(): PaletteOptions {
  return {
    mode: 'dark',
    primary: {
      main: designColors.primary[400],
      light: designColors.primary[300],
      dark: designColors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designColors.secondary[400],
      light: designColors.secondary[300],
      dark: designColors.secondary[600],
      contrastText: '#ffffff',
    },
    success: {
      main: designColors.success[400],
      light: designColors.success[300],
      dark: designColors.success[600],
      contrastText: '#ffffff',
    },
    warning: {
      main: designColors.warning[400],
      light: designColors.warning[300],
      dark: designColors.warning[600],
      contrastText: '#ffffff',
    },
    error: {
      main: designColors.error[400],
      light: designColors.error[300],
      dark: designColors.error[600],
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
  };
}
