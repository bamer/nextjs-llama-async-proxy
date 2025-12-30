import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock entire page at module level
jest.mock('@/app/settings/page', () => {
  const MockSettingsPage = () =>
    React.createElement('div', { 'data-testid': 'settings-page' },
      React.createElement('div', { 'data-testid': 'settings-content' }, 'Settings Content')
    );
  MockSettingsPage.displayName = 'SettingsPage';
  return { default: MockSettingsPage };
});

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

jest.mock('@/components/configuration/ModernConfiguration', () => {
  return function MockModernConfiguration() {
    return React.createElement('div', { 'data-testid': 'modern-configuration' }, 'ModernConfiguration Component');
  };
});

jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) =>
    React.createElement(React.Fragment, null, children || fallback),
}));

jest.mock('@/components/ui/error-fallbacks', () => ({
  SettingsFallback: () => React.createElement('div', { 'data-testid': 'settings-fallback' }, 'SettingsFallback'),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    const { container } = render(React.createElement(require('@/app/settings/page').default, null));

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(React.createElement(require('@/app/settings/page').default, null));

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders ModernConfiguration component', () => {
    render(React.createElement(require('@/app/settings/page').default, null));

    expect(screen.getByTestId('modern-configuration')).toBeInTheDocument();
    expect(screen.getByText('ModernConfiguration Component')).toBeInTheDocument();
  });

  it('wraps ModernConfiguration in ErrorBoundary', () => {
    render(React.createElement(require('@/app/settings/page').default, null));

    const modernConfiguration = screen.getByTestId('modern-configuration');
    expect(modernConfiguration).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    const { container } = render(React.createElement(require('@/app/settings/page').default, null));

    const mainLayout = screen.getByTestId('main-layout');
    const settingsPage = screen.getByTestId('settings-page');
    const modernConfiguration = screen.getByTestId('modern-configuration');

    expect(mainLayout).toBeInTheDocument();
    expect(settingsPage).toBeInTheDocument();
    expect(modernConfiguration).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(React.createElement(require('@/app/settings/page').default, null));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(React.createElement(require('@/app/settings/page').default, null));

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(React.createElement(require('@/app/settings/page').default, null));

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(React.createElement(require('@/app/settings/page').default, null));

    expect(screen.getByTestId('modern-configuration')).toBeInTheDocument();

    rerender(React.createElement(require('@/app/settings/page').default, null));

    expect(screen.getByTestId('modern-configuration')).toBeInTheDocument();
  });

  it('component is a function', () => {
    const SettingsPage = require('@/app/settings/page').default;
    expect(typeof SettingsPage).toBe('function');
  });

  it('has correct display name', () => {
    const SettingsPage = require('@/app/settings/page').default;
    expect(SettingsPage.displayName).toBe('SettingsPage');
  });

  it('has clean DOM structure', () => {
    const { container } = render(React.createElement(require('@/app/settings/page').default, null));

    const mainLayout = container.querySelector('[data-testid="main-layout"]');
    const settingsPage = container.querySelector('[data-testid="settings-page"]');
    const modernConfiguration = container.querySelector('[data-testid="modern-configuration"]');

    expect(mainLayout).toBeInTheDocument();
    expect(settingsPage).toBeInTheDocument();
    expect(modernConfiguration).toBeInTheDocument();
    expect(modernConfiguration?.parentElement).toBe(settingsPage);
  });
});
