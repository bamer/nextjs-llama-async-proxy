import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

const mockTheme: Theme = createTheme({
  palette: {
    mode: 'light' as 'light' | 'dark',
    primary: {
      main: '#3B82F6',
    },
  },
});

export const MockThemeProvider: React.FC<{ theme?: Theme }> = ({ theme = mockTheme, children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export const createMockTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#3B82F6',
      },
    },
  });
};

export const mockResponsiveContext = {
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
  down: jest.fn(),
  up: jest.fn(),
  between: jest.fn(),
  only: jest.fn(),
};

export const wrapWithProviders = (component: React.ReactElement): React.ReactElement => {
  return <MockThemeProvider>{component}</MockThemeProvider>;
};
