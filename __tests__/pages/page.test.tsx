import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import HomePage from '@/app/page';

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) =>
    React.createElement('a', { href, 'data-href': href }, children);
  return MockLink;
});

// Mock MUI components with proper prop filtering
jest.mock('@mui/material', () => ({
  Typography: ({ children, variant, ...props }: any) => {
    const { gutterBottom, ...filteredProps } = props;
    return React.createElement(variant === 'h1' || variant === 'h2' || variant === 'h4' ? 'h1' : 'p', filteredProps, children);
  },
  Box: ({ children, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Button: ({ children, ...props }: any) => {
    const { sx, variant, color, ...filteredProps } = props;
    return React.createElement('button', filteredProps, children);
  },
  Card: ({ children, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => {
    const { size, spacing, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Rocket: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Rocket', width: 24, height: 24 }),
  Dashboard: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Dashboard', width: 24, height: 24 }),
  ModelTraining: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ModelTraining', width: 24, height: 24 }),
  Monitor: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Monitor', width: 24, height: 24 }),
  Settings: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Settings', width: 24, height: 24 }),
  BarChart: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'BarChart', width: 24, height: 24 }),
  Code: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Code', width: 24, height: 24 }),
  Cloud: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Cloud', width: 24, height: 24 }),
  Terminal: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Terminal', width: 24, height: 24 }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    const { container } = render(<HomePage />);

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(<HomePage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders welcome title', () => {
    render(<HomePage />);

    expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<HomePage />);

    expect(screen.getByText(/ultimate platform for managing/)).toBeInTheDocument();
  });

  it('renders get started button', () => {
    render(<HomePage />);

    const button = screen.getByRole('button', { name: /get started/i });
    expect(button).toBeInTheDocument();
  });

  it('has correct page structure', () => {
    const { container } = render(<HomePage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(container.querySelector('h1')).toBeInTheDocument();
  });

  it('rocket icon is rendered', () => {
    const { container } = render(<HomePage />);

    const rocket = container.querySelector('[data-icon="Rocket"]');
    expect(rocket).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<HomePage />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(<HomePage />);

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('renders features section', () => {
    render(<HomePage />);

    expect(screen.getByText('Key Features')).toBeInTheDocument();
    expect(screen.getByText('Real-time Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Model Management')).toBeInTheDocument();
    expect(screen.getByText('Advanced Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Custom Configuration')).toBeInTheDocument();
  });

  it('renders quick stats section', () => {
    render(<HomePage />);

    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('4+')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('1000+')).toBeInTheDocument();
  });

  it('renders technology stack', () => {
    render(<HomePage />);

    expect(screen.getByText('Built with Modern Technologies')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('Material UI')).toBeInTheDocument();
    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders getting started section', () => {
    render(<HomePage />);

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText(/New to Llama Runner Pro/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view documentation/i })).toBeInTheDocument();
  });

  it('snapshot test', () => {
    const { container } = render(<HomePage />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(<HomePage />);

    expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();

    rerender(<HomePage />);

    expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
  });

  it('component is a function', () => {
    expect(typeof HomePage).toBe('function');
  });

  it('has proper heading structure', () => {
    const { container } = render(<HomePage />);

    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Welcome to Llama Runner Pro');
  });

  it('has accessible page content', () => {
    render(<HomePage />);

    const main = screen.getByTestId('main-layout');

    expect(main).toBeInTheDocument();
  });
});
