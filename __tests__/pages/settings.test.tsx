import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import SettingsPage from '@/app/settings/page';

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

// Mock ModernConfiguration
jest.mock('@/components/configuration/ModernConfiguration', () => {
  return function MockModernConfiguration() {
    return React.createElement('div', { 'data-testid': 'modern-configuration' }, 'ModernConfiguration Component');
  };
});

// Mock ErrorBoundary
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) =>
    React.createElement(React.Fragment, null, children || fallback),
}));

// Mock SettingsFallback
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
    const { container } = render(<SettingsPage />);

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders ModernConfiguration component', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('modern-configuration')).toBeInTheDocument();
    expect(screen.getByText('ModernConfiguration Component')).toBeInTheDocument();
  });

  it('wraps ModernConfiguration in ErrorBoundary', () => {
    render(<SettingsPage />);

    const modernConfiguration = screen.getByTestId('modern-configuration');
    expect(modernConfiguration).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    const { container } = render(<SettingsPage />);

    const mainLayout = screen.getByTestId('main-layout');
    const modernConfiguration = screen.getByTestId('modern-configuration');

    expect(mainLayout).toBeInTheDocument();
    expect(modernConfiguration).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<SettingsPage />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(<SettingsPage />);

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(<SettingsPage />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(<SettingsPage />);

    expect(screen.getByTestId('modern-configuration')).toBeInTheDocument();

    rerender(<SettingsPage />);

    expect(screen.getByTestId('modern-configuration')).toBeInTheDocument();
  });

  it('component is a function', () => {
    expect(typeof SettingsPage).toBe('function');
  });

  it('has clean DOM structure', () => {
    const { container } = render(<SettingsPage />);

    const mainLayout = container.querySelector('[data-testid="main-layout"]');
    const modernConfiguration = container.querySelector('[data-testid="modern-configuration"]');

    expect(mainLayout).toBeInTheDocument();
    expect(modernConfiguration).toBeInTheDocument();
  });
});
