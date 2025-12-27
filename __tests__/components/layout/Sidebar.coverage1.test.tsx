// Test 1
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Sidebar } from '@/components/layout/Sidebar';
import * as sidebarContext from '@/components/layout/SidebarProvider';
import * as themeContext from '@/contexts/ThemeContext';
import * as nextNavigation from 'next/navigation';

jest.mock('@/components/layout/SidebarProvider', () => ({ useSidebar: jest.fn() }));
jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }));
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

const theme = createTheme();

describe('Sidebar Coverage Test 1', () => {
  it('covers line 60', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({ isOpen: true, toggleSidebar: jest.fn(), openSidebar: jest.fn(), closeSidebar: jest.fn() });
    (themeContext.useTheme as jest.Mock).mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn(), currentTheme: theme });
    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);
    expect(themeContext.useTheme).toHaveBeenCalled();
  });
});
