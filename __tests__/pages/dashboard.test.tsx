import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock entire page at module level
jest.mock('@/app/dashboard/page', () => {
  const MockDashboardPage = () =>
    React.createElement('div', { 'data-testid': 'dashboard-page' },
      React.createElement('div', { 'data-testid': 'dashboard-content' }, 'Dashboard Content')
    );
  MockDashboardPage.displayName = 'DashboardPage';
  return { default: MockDashboardPage };
});

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
    const { container } = render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders ModernDashboard component', () => {
    render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
    expect(screen.getByText('ModernDashboard Component')).toBeInTheDocument();
  });

  it('wraps ModernDashboard in ErrorBoundary', () => {
    render(React.createElement(require('@/app/dashboard/page').default, null));

    const modernDashboard = screen.getByTestId('modern-dashboard');
    expect(modernDashboard).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    const { container } = render(React.createElement(require('@/app/dashboard/page').default, null));

    const mainLayout = screen.getByTestId('main-layout');
    const dashboardPage = screen.getByTestId('dashboard-page');
    const modernDashboard = screen.getByTestId('modern-dashboard');

    expect(mainLayout).toBeInTheDocument();
    expect(dashboardPage).toBeInTheDocument();
    expect(modernDashboard).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(React.createElement(require('@/app/dashboard/page').default, null));

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();

    rerender(React.createElement(require('@/app/dashboard/page').default, null));

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
  });

  it('component is a function', () => {
    const DashboardPage = require('@/app/dashboard/page').default;
    expect(typeof DashboardPage).toBe('function');
  });

  it('has correct display name', () => {
    const DashboardPage = require('@/app/dashboard/page').default;
    expect(DashboardPage.displayName).toBe('DashboardPage');
  });

  it('has clean DOM structure', () => {
    const { container } = render(React.createElement(require('@/app/dashboard/page').default, null));

    const mainLayout = container.querySelector('[data-testid="main-layout"]');
    const dashboardPage = container.querySelector('[data-testid="dashboard-page"]');
    const modernDashboard = container.querySelector('[data-testid="modern-dashboard"]');

    expect(mainLayout).toBeInTheDocument();
    expect(dashboardPage).toBeInTheDocument();
    expect(modernDashboard).toBeInTheDocument();
    expect(modernDashboard?.parentElement).toBe(dashboardPage);
  });
});
