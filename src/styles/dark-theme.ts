// src/styles/dark-theme.ts
import { createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { baseTheme } from './base-theme';
import { designTokens } from './design-tokens';

// Dark Theme
export const darkTheme = createTheme(
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