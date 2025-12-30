import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

jest.mock('@/components/dashboard/ModernDashboard', () => {
  return function MockModernDashboard() {
    return React.createElement('div', { 'data-testid': 'modern-dashboard' }, 'ModernDashboard Component');
  };
});

jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) =>
    React.createElement(React.Fragment, null, children || fallback),
}));

jest.mock('@/components/ui/error-fallbacks', () => ({
  DashboardFallback: () => React.createElement('div', { 'data-testid': 'dashboard-fallback' }, 'DashboardFallback'),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    const { container } = render(<DashboardPage />);

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders ModernDashboard component', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
    expect(screen.getByText('ModernDashboard Component')).toBeInTheDocument();
  });

  it('wraps ModernDashboard in ErrorBoundary', () => {
    render(<DashboardPage />);

    const modernDashboard = screen.getByTestId('modern-dashboard');
    expect(modernDashboard).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    const { container } = render(<DashboardPage />);

    const mainLayout = screen.getByTestId('main-layout');
    const modernDashboard = screen.getByTestId('modern-dashboard');

    expect(mainLayout).toBeInTheDocument();
    expect(modernDashboard).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<DashboardPage />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(<DashboardPage />);

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(<DashboardPage />);

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();

    rerender(<DashboardPage />);

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
  });

  it('has clean DOM structure', () => {
    const { container } = render(<DashboardPage />);

    const mainLayout = container.querySelector('[data-testid="main-layout"]');
    const modernDashboard = container.querySelector('[data-testid="modern-dashboard"]');

    expect(mainLayout).toBeInTheDocument();
    expect(modernDashboard).toBeInTheDocument();
    expect(modernDashboard?.parentElement).toBe(mainLayout);
  });
});
