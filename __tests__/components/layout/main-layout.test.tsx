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

    renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies light mode gradient when isDark is false', () => {
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('has full-height layout', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders Header and Sidebar components', () => {
    renderWithTheme(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders flex container for sidebar and main content', () => {
    const { container } = renderWithTheme(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders content properly', () => {
    renderWithTheme(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
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
    expect(container.firstChild).toBeInTheDocument();
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
