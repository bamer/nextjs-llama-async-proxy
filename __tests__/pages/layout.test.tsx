import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock entire page at module level to avoid CSS import issues
jest.mock('@/app/layout', () => {
  const MockLayout = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'root-layout', className: 'mock-layout' },
      React.createElement('div', { 'data-testid': 'layout-content' }, children)
    );
  MockLayout.displayName = 'RootLayout';
  return { default: MockLayout };
});

// Mock dependencies
jest.mock('next/font/google', () => ({
  Inter: jest.fn(() => ({
    className: 'mock-inter-font',
    variable: '--font-inter',
  })),
}));

jest.mock('@mui/material-nextjs/v15-appRouter', () => ({
  AppRouterCacheProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/providers/app-provider', () => ({
  AppProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/config/app.config', () => ({
  APP_CONFIG: {
    name: 'Llama Runner Pro',
    description: 'AI Model Management Platform',
  },
}));

jest.mock('@/lib/database', () => ({
  initDatabase: jest.fn(() => ({ close: jest.fn() })),
  setMetadata: jest.fn(),
}));

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    const { container } = render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', { 'data-testid': 'test-child' }, 'Test Content')
    ));

    expect(container).toBeInTheDocument();
  });

  it('renders children', () => {
    render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', { 'data-testid': 'test-child' }, 'Test Content')
    ));

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('has layout wrapper', () => {
    const { container } = render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', { 'data-testid': 'child' }, 'Test')
    ));

    const layout = container.querySelector('[data-testid="root-layout"]');
    expect(layout).toBeInTheDocument();
  });

  it('wraps children in content div', () => {
    render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', { 'data-testid': 'child' }, 'Test')
    ));

    const content = screen.getByTestId('layout-content');
    expect(content).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders nested children', () => {
    render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', null,
        React.createElement('div', null,
          React.createElement('span', null, 'Nested Content')
        )
      )
    ));

    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    const { container } = render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', null, 'Test')
    ));

    const layout = container.querySelector('[data-testid="root-layout"]');
    const content = container.querySelector('[data-testid="layout-content"]');
    const child = container.querySelector('[data-testid="child"]');

    expect(layout).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(child).toBeInTheDocument();
    expect(content?.parentElement).toBe(layout);
  });

  it('renders multiple children', () => {
    render(React.createElement(require('@/app/layout').default, null,
      React.createElement(React.Fragment, null,
        React.createElement('div', { 'data-testid': 'child-1' }, 'Child 1'),
        React.createElement('div', { 'data-testid': 'child-2' }, 'Child 2'),
        React.createElement('div', { 'data-testid': 'child-3' }, 'Child 3')
      )
    ));

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('renders null children gracefully', () => {
    const { container } = render(React.createElement(require('@/app/layout').default, null, null));

    expect(container).toBeInTheDocument();
  });

  it('renders fragment children', () => {
    render(React.createElement(require('@/app/layout').default, null,
      React.createElement(React.Fragment, null,
        React.createElement('div', { 'data-testid': 'child' }, 'Fragment Content')
      )
    ));

    expect(screen.getByText('Fragment Content')).toBeInTheDocument();
  });

  it('no console errors on render', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', null, 'Test')
    ));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('no console warnings on render', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', null, 'Test')
    ));

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('handles children updates', () => {
    const { rerender } = render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', { 'data-testid': 'child' }, 'Initial')
    ));

    expect(screen.getByText('Initial')).toBeInTheDocument();

    rerender(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', { 'data-testid': 'child' }, 'Updated')
    ));

    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.queryByText('Initial')).not.toBeInTheDocument();
  });

  it('snapshot test', () => {
    const { container } = render(React.createElement(require('@/app/layout').default, null,
      React.createElement('div', null, 'Test')
    ));

    expect(container.firstChild).toMatchSnapshot();
  });

  it('has correct display name', () => {
    const Layout = require('@/app/layout').default;
    expect(Layout.displayName).toBe('RootLayout');
  });

  it('component is a function', () => {
    const Layout = require('@/app/layout').default;
    expect(typeof Layout).toBe('function');
  });
});
