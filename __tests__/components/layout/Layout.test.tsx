import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Layout from '@/components/layout/Layout';

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

jest.mock('@/components/layout/SidebarProvider', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  useSidebar: jest.fn(() => ({
    isOpen: false,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: jest.fn(),
  })),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Layout', () => {
  it('renders children correctly', () => {
    renderWithTheme(
      <Layout>
        <div data-testid="child-content">Test Content</div>
      </Layout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders Header component', () => {
    renderWithTheme(<Layout>Test</Layout>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders Sidebar component', () => {
    renderWithTheme(<Layout>Test</Layout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders SidebarProvider', () => {
    renderWithTheme(<Layout>Test</Layout>);
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('wraps children in main element with correct classes', () => {
    const { container } = renderWithTheme(
      <Layout>
        <div data-testid="test">Test</div>
      </Layout>
    );
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('flex-1', 'p-6', 'pt-20', 'bg-layout', 'transition-all', 'duration-300');
  });

  it('applies ml-64 class when sidebar is open', () => {
    const { useSidebar } = require('@/components/layout/SidebarProvider');
    useSidebar.mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    const { container } = renderWithTheme(
      <Layout>
        <div>Test</div>
      </Layout>
    );
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('md:ml-64');
  });

  it('does not apply ml-64 class when sidebar is closed', () => {
    const { useSidebar } = require('@/components/layout/SidebarProvider');
    useSidebar.mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    const { container } = renderWithTheme(
      <Layout>
        <div>Test</div>
      </Layout>
    );
    const mainElement = container.querySelector('main');
    expect(mainElement).not.toHaveClass('md:ml-64');
  });

  it('renders container with max-w-7xl and mx-auto', () => {
    const { container } = renderWithTheme(
      <Layout>
        <div>Test</div>
      </Layout>
    );
    const contentContainer = container.querySelector('main > div');
    expect(contentContainer).toHaveClass('max-w-7xl', 'mx-auto');
  });

  it('renders container with min-h-screen and flex flex-col', () => {
    const { container } = renderWithTheme(<Layout>Test</Layout>);
    const layoutContainer = container.querySelector('.min-h-screen');
    expect(layoutContainer).toHaveClass('flex', 'flex-col');
  });

  it('renders multiple children correctly', () => {
    renderWithTheme(
      <Layout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </Layout>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('renders nested children correctly', () => {
    renderWithTheme(
      <Layout>
        <div data-testid="parent">
          <div data-testid="child">Nested Content</div>
        </div>
      </Layout>
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
      <Layout>
        <TestChild title="Test" count={42} />
      </Layout>
    );

    expect(screen.getByTestId('test-child')).toHaveTextContent('Test - 42');
  });

  it('renders empty children', () => {
    const { container } = renderWithTheme(<Layout>{null}</Layout>);
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});
