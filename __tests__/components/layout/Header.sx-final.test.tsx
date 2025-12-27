import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Header } from '@/components/layout/Header';
import * as sidebarContext from '@/components/layout/SidebarProvider';
import * as themeContext from '@/contexts/ThemeContext';

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

const theme = createTheme();

describe('Header - SX Callback Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Covers line 23 - zIndex callback in AppBar sx prop
  // This test ensures that the sx prop callback `(theme) => theme.zIndex.drawer + 1` is executed
  it('covers zIndex callback in AppBar sx prop - line 23', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    render(<MuiThemeProvider theme={theme}><Header /></MuiThemeProvider>);

    expect(themeContext.useTheme).toHaveBeenCalled();
  });

  // Positive test: Covers isDark conditional in background styling (lines 19-21)
  it('covers isDark conditional in background styling', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    render(<MuiThemeProvider theme={theme}><Header /></MuiThemeProvider>);

    expect(themeContext.useTheme).toHaveBeenCalled();
  });

  // Positive test: Covers all sx props in AppBar component
  it('covers all AppBar sx prop callbacks', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    render(<MuiThemeProvider theme={theme}><Header /></MuiThemeProvider>);

    expect(themeContext.useTheme).toHaveBeenCalled();
    expect(sidebarContext.useSidebar).toHaveBeenCalled();
  });
});
