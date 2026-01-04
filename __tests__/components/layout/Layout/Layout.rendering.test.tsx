import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Layout from '@/components/layout/Layout';
import { renderWithTheme } from './Layout.test-utils';

describe('Layout Rendering', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
    jest.mocked(useSidebar).mockReturnValue({
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
    jest.mocked(useSidebar).mockReturnValue({
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
});
