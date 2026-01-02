// src/styles/light-theme.ts
import { createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { baseTheme } from './base-theme';
import { designTokens } from './design-tokens';

// Light Theme
export const lightTheme = createTheme(
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