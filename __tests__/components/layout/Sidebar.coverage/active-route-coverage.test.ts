import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '@/components/layout/Sidebar';
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

describe('Sidebar - Active Route Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('covers isActive function for dashboard route', () => {
    renderWithTheme(<Sidebar />, true, false, '/dashboard');

    expect(screen.getByTestId('menu-item-dashboard')).toBeInTheDocument();
  });

  it('covers isActive function for monitoring route', () => {
    renderWithTheme(<Sidebar />, true, false, '/monitoring');

    expect(screen.getByTestId('menu-item-monitoring')).toBeInTheDocument();
  });

  it('covers isActive function for models route', () => {
    renderWithTheme(<Sidebar />, true, false, '/models');

    expect(screen.getByTestId('menu-item-models')).toBeInTheDocument();
  });

  it('covers isActive function for logs route', () => {
    renderWithTheme(<Sidebar />, true, false, '/logs');

    expect(screen.getByTestId('menu-item-logs')).toBeInTheDocument();
  });

  it('covers isActive function for settings route', () => {
    renderWithTheme(<Sidebar />, true, false, '/settings');

    expect(screen.getByTestId('menu-item-settings')).toBeInTheDocument();
  });
});
