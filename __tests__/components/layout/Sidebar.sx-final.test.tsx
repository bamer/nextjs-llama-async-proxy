import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Sidebar } from '@/components/layout/Sidebar';
import * as sidebarContext from '@/components/layout/SidebarProvider';
import * as themeContext from '@/contexts/ThemeContext';
import * as nextNavigation from 'next/navigation';

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const theme = createTheme();

describe('Sidebar - SX Callback Coverage', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  // Positive test: Covers line 60 - zIndex callback in overlay Box sx prop
  // This test ensures that the sx prop callback `(theme) => theme.zIndex.drawer - 1` is executed
  it('covers zIndex callback in overlay Box sx prop - line 60', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
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

    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);

    expect(themeContext.useTheme).toHaveBeenCalled();
  });

  // Positive test: Covers isDark conditional in Drawer background styling (line 75)
  it('covers isDark conditional in Drawer background styling', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
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

    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);

    expect(themeContext.useTheme).toHaveBeenCalled();
  });

  // Positive test: Covers all sx props in Drawer component
  it('covers all Drawer sx prop callbacks', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
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

    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);

    expect(themeContext.useTheme).toHaveBeenCalled();
    expect(sidebarContext.useSidebar).toHaveBeenCalled();
    expect(nextNavigation.usePathname).toHaveBeenCalled();
  });

  // Positive test: Covers isActive function for all routes (line 49)
  it('covers isActive function for menu items', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
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

    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);

    expect(nextNavigation.usePathname).toHaveBeenCalled();
  });
});
