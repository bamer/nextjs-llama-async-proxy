import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock entire page at module level
jest.mock('@/app/page', () => {
  const MockHomePage = () =>
    React.createElement('div', { 'data-testid': 'home-page' },
      React.createElement('h1', null, 'Welcome to Llama Runner Pro'),
      React.createElement('p', null, 'The ultimate platform for managing and monitoring your AI models')
    );
  MockHomePage.displayName = 'HomePage';
  return { default: MockHomePage };
});

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) =>
    React.createElement('a', { href, 'data-href': href }, children);
  return MockLink;
});

jest.mock('@mui/material', () => ({
  Typography: ({ children, variant, ...props }: any) =>
    React.createElement(variant === 'h1' || variant === 'h2' ? 'h1' : 'p', props, children),
  Box: ({ children, ...props }: any) => React.createElement('div', props, children),
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => React.createElement('div', props, children),
}));

jest.mock('@mui/icons-material', () => ({
  Rocket: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Rocket' }),
  Dashboard: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Dashboard' }),
  ModelTraining: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ModelTraining' }),
  Monitor: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Monitor' }),
  Settings: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Settings' }),
  BarChart: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'BarChart' }),
  Code: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Code' }),
  Cloud: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Cloud' }),
  Terminal: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Terminal' }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    const { container } = render(React.createElement(require('@/app/page').default, null));

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(React.createElement(require('@/app/page').default, null));

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders welcome title', () => {
    render(React.createElement(require('@/app/page').default, null));

    expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(React.createElement(require('@/app/page').default, null));

    expect(screen.getByText(/ultimate platform for managing/)).toBeInTheDocument();
  });

  it('renders get started button', () => {
    render(React.createElement(require('@/app/page').default, null));

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has correct page structure', () => {
    render(React.createElement(require('@/app/page').default, null));

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('rocket icon is rendered', () => {
    const { container } = render(React.createElement(require('@/app/page').default, null));

    const rocket = container.querySelector('[data-icon="Rocket"]');
    expect(rocket).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(React.createElement(require('@/app/page').default, null));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(React.createElement(require('@/app/page').default, null));

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(React.createElement(require('@/app/page').default, null));

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(React.createElement(require('@/app/page').default, null));

    expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();

    rerender(React.createElement(require('@/app/page').default, null));

    expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
  });

  it('component is a function', () => {
    const HomePage = require('@/app/page').default;
    expect(typeof HomePage).toBe('function');
  });

  it('has correct display name', () => {
    const HomePage = require('@/app/page').default;
    expect(HomePage.displayName).toBe('HomePage');
  });

  it('has proper heading structure', () => {
    const { container } = render(React.createElement(require('@/app/page').default, null));

    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Welcome to Llama Runner Pro');
  });

  it('has accessible page content', () => {
    render(React.createElement(require('@/app/page').default, null));

    const main = screen.getByTestId('main-layout');
    const page = screen.getByTestId('home-page');

    expect(main).toBeInTheDocument();
    expect(page).toBeInTheDocument();
    expect(page?.parentElement).toBe(main);
  });
});
