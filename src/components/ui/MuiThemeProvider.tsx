'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getTheme } from '../../config/mui-theme';

interface MuiThemeProviderWrapperProps {
  children: React.ReactNode;
}

export function MuiThemeProviderWrapper({ children }: MuiThemeProviderWrapperProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a minimal theme during SSR
    return (
      <MuiThemeProvider theme={getTheme('light')}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  const muiTheme = getTheme(resolvedTheme === 'dark' ? 'dark' : 'light');

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}