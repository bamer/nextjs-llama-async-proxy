import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import * as sidebarContext from '@/components/layout/SidebarProvider';
import * as themeContext from '@/contexts/ThemeContext';
import * as nextNavigation from 'next/navigation';
import { renderWithTheme } from './test-utils';

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar - Rendering Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Sidebar with proper theme provider - covers sx callbacks', () => {
    renderWithTheme(<Sidebar />, true, false);

    expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-monitoring')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-models')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-logs')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-settings')).toBeInTheDocument();
  });

  it('renders Sidebar in dark mode - exercises sx prop with isDark true', () => {
    renderWithTheme(<Sidebar />, true, true);

    expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();
  });

  it('uses theme, sidebar, and navigation contexts', () => {
    renderWithTheme(<Sidebar />, true);

    expect(themeContext.useTheme).toHaveBeenCalled();
    expect(sidebarContext.useSidebar).toHaveBeenCalled();
    expect(nextNavigation.usePathname).toHaveBeenCalled();
  });
});
