import { createTheme, ThemeOptions } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { designColors, designShadows, getLightPalette, getDarkPalette } from './theme-colors';
import { getTypographyOptions } from './theme-typography';
import { getBaseTheme } from './theme-spacing';

const baseTheme: ThemeOptions = deepmerge(getBaseTheme(), {
  typography: getTypographyOptions(),
});

export const lightTheme = createTheme(
  deepmerge(baseTheme, {
    palette: getLightPalette(),
  })
);

export const darkTheme = createTheme(
  deepmerge(baseTheme, {
    palette: getDarkPalette(),
  })
);

export const designTokens = {
  colors: designColors,
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
  shadows: designShadows,
};

export type { ThemeOptions };
export default { lightTheme, darkTheme, designTokens };
