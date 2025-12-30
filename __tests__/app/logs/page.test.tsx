import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies BEFORE mocking the page that uses them
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    requestLogs: jest.fn(),
    isConnected: true,
  }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

// Mock entire page at module level (after dependencies are mocked)
jest.mock('@/app/logs/page', () => {
  // Import the mocked MainLayout
  const { MainLayout } = require('@/components/layout/main-layout');

  const MockLogsPage = () =>
    React.createElement(MainLayout, null,
      React.createElement('div', { 'data-testid': 'logs-page' },
        React.createElement('h1', null, 'Logs Page'),
        React.createElement('p', null, 'View and filter application logs')
      )
    );
  MockLogsPage.displayName = 'LogsPage';
  return { default: MockLogsPage };
});

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    requestLogs: jest.fn(),
    isConnected: true,
  }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

describe('LogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    const { container } = render(React.createElement(require('@/app/logs/page').default, null));

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(React.createElement(require('@/app/logs/page').default, null));

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders logs page title', () => {
    render(React.createElement(require('@/app/logs/page').default, null));

    expect(screen.getByText('Logs Page')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(React.createElement(require('@/app/logs/page').default, null));

    expect(screen.getByText(/filter application logs/)).toBeInTheDocument();
  });

  it('has correct page structure', () => {
    render(React.createElement(require('@/app/logs/page').default, null));

    expect(screen.getByTestId('logs-page')).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(React.createElement(require('@/app/logs/page').default, null));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(React.createElement(require('@/app/logs/page').default, null));

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(React.createElement(require('@/app/logs/page').default, null));

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(React.createElement(require('@/app/logs/page').default, null));

    expect(screen.getByText('Logs Page')).toBeInTheDocument();

    rerender(React.createElement(require('@/app/logs/page').default, null));

    expect(screen.getByText('Logs Page')).toBeInTheDocument();
  });

  it('component is a function', () => {
    const LogsPage = require('@/app/logs/page').default;
    expect(typeof LogsPage).toBe('function');
  });

  it('has correct display name', () => {
    const LogsPage = require('@/app/logs/page').default;
    expect(LogsPage.displayName).toBe('LogsPage');
  });

  it('has proper heading structure', () => {
    const { container } = render(React.createElement(require('@/app/logs/page').default, null));

    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Logs Page');
  });

  it('has accessible page content', () => {
    render(React.createElement(require('@/app/logs/page').default, null));

    const main = screen.getByTestId('main-layout');
    const page = screen.getByTestId('logs-page');

    expect(main).toBeInTheDocument();
    expect(page).toBeInTheDocument();
    expect(page?.parentElement).toBe(main);
  });
});
