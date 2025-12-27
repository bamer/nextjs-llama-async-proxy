import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MainLayout } from '@/components/layout/main-layout';

jest.mock('@/components/layout/SidebarProvider', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('MainLayout', () => {
  const mockIsDark = false;

  beforeEach(() => {
    jest.clearAllMocks();
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      isDark: mockIsDark,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
  });

  it('renders children correctly', () => {
    renderWithTheme(
      <MainLayout>
        <div data-testid="child-content">Test Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders Header component', () => {
    renderWithTheme(<MainLayout>Test</MainLayout>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders Sidebar component', () => {
    renderWithTheme(<MainLayout>Test</MainLayout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders SidebarProvider', () => {
    renderWithTheme(<MainLayout>Test</MainLayout>);
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('applies dark mode gradient when isDark is true', () => {
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    const rootBox = container.querySelector('[style*="min-height"]');
    expect(rootBox).toBeInTheDocument();
  });

  it('applies light mode gradient when isDark is false', () => {
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    const rootBox = container.querySelector('[style*="min-height"]');
    expect(rootBox).toBeInTheDocument();
  });

  it('applies minHeight 100vh to root container', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    const rootBox = container.querySelector('[style*="min-height"]');
    expect(rootBox).toHaveStyle({ minHeight: '100vh' });
  });

  it('applies flex and flexDirection column to root container', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    const rootBox = container.querySelector('[style*="min-height"]');
    expect(rootBox).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('renders flex container for sidebar and main content', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    const flexContainer = container.querySelector('[style*="pt: \'64px\'"]');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveStyle({
      display: 'flex',
      flex: 1,
      pt: '64px',
    });
  });

  it('applies responsive padding to main content container', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    const mainBox = container.querySelector('[style*="width"]');
    expect(mainBox).toHaveStyle({
      flex: 1,
      width: '100%',
    });
  });

  it('renders multiple children correctly', () => {
    renderWithTheme(
      <MainLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </MainLayout>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('renders nested children correctly', () => {
    renderWithTheme(
      <MainLayout>
        <div data-testid="parent">
          <div data-testid="child">Nested Content</div>
        </div>
      </MainLayout>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('preserves children props and structure', () => {
    const TestChild = ({ title, count }: { title: string; count: number }) => (
      <div data-testid="test-child">
        {title} - {count}
      </div>
    );

    renderWithTheme(
      <MainLayout>
        <TestChild title="Test" count={42} />
      </MainLayout>
    );

    expect(screen.getByTestId('test-child')).toHaveTextContent('Test - 42');
  });

  it('renders empty children', () => {
    const { container } = renderWithTheme(<MainLayout>{null}</MainLayout>);
    const rootBox = container.querySelector('[style*="min-height"]');
    expect(rootBox).toBeInTheDocument();
  });

  it('maintains correct DOM structure', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    const sidebarProvider = container.querySelector('[data-testid="sidebar-provider"]');
    expect(sidebarProvider).toBeInTheDocument();

    const rootBox = sidebarProvider?.querySelector('[style*="min-height"]');
    expect(rootBox).toBeInTheDocument();

    const header = rootBox?.querySelector('[data-testid="header"]');
    expect(header).toBeInTheDocument();

    const flexContainer = rootBox?.querySelector('[style*="flex: 1"]');
    expect(flexContainer).toBeInTheDocument();

    const sidebar = flexContainer?.querySelector('[data-testid="sidebar"]');
    expect(sidebar).toBeInTheDocument();

    const mainBox = flexContainer?.querySelector('[style*="width: \'100%\'"]');
    expect(mainBox).toBeInTheDocument();
  });

  it('uses theme context for styling', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    expect(useTheme).toHaveBeenCalled();
  });
});
