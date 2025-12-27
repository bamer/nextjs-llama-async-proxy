import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { RootLayoutContent } from '@/components/layout/RootLayoutContent';

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

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('RootLayoutContent', () => {
  it('renders children correctly', () => {
    renderWithTheme(
      <RootLayoutContent>
        <div data-testid="child-content">Test Content</div>
      </RootLayoutContent>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders Header component', () => {
    renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders Sidebar component', () => {
    renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders SidebarProvider', () => {
    renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('wraps children in main element', () => {
    const { container } = renderWithTheme(
      <RootLayoutContent>
        <div data-testid="test">Test</div>
      </RootLayoutContent>
    );
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('applies correct classes to main element', () => {
    const { container } = renderWithTheme(
      <RootLayoutContent>
        <div>Test</div>
      </RootLayoutContent>
    );
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('flex-1', 'lg:ml-64', 'transition-all', 'duration-300');
  });

  it('renders content container with p-6 and max-w-7xl', () => {
    const { container } = renderWithTheme(
      <RootLayoutContent>
        <div>Test</div>
      </RootLayoutContent>
    );
    const contentContainer = container.querySelector('main > div');
    expect(contentContainer).toHaveClass('p-6', 'max-w-7xl', 'mx-auto');
  });

  it('renders root container with min-h-screen and flex flex-col', () => {
    const { container } = renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    const rootContainer = container.querySelector('.min-h-screen');
    expect(rootContainer).toHaveClass('flex', 'flex-col');
  });

  it('renders bg-background class on root container', () => {
    const { container } = renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    const rootContainer = container.querySelector('.min-h-screen');
    expect(rootContainer).toHaveClass('bg-background');
  });

  it('renders flex container for header, sidebar, and main', () => {
    const { container } = renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    const flexContainer = container.querySelector('.pt-16');
    expect(flexContainer).toHaveClass('flex', 'flex-1');
  });

  it('applies pt-16 to flex container', () => {
    const { container } = renderWithTheme(<RootLayoutContent>Test</RootLayoutContent>);
    const flexContainer = container.querySelector('.pt-16');
    expect(flexContainer).toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    renderWithTheme(
      <RootLayoutContent>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </RootLayoutContent>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('renders nested children correctly', () => {
    renderWithTheme(
      <RootLayoutContent>
        <div data-testid="parent">
          <div data-testid="child">Nested Content</div>
        </div>
      </RootLayoutContent>
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
      <RootLayoutContent>
        <TestChild title="Test" count={42} />
      </RootLayoutContent>
    );

    expect(screen.getByTestId('test-child')).toHaveTextContent('Test - 42');
  });

  it('renders empty children', () => {
    const { container } = renderWithTheme(<RootLayoutContent>{null}</RootLayoutContent>);
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('maintains correct DOM structure', () => {
    const { container } = renderWithTheme(
      <RootLayoutContent>
        <div>Content</div>
      </RootLayoutContent>
    );

    const rootContainer = container.querySelector('.min-h-screen');
    expect(rootContainer).toBeInTheDocument();

    const header = rootContainer?.querySelector('[data-testid="header"]');
    expect(header).toBeInTheDocument();

    const flexContainer = rootContainer?.querySelector('.flex-1');
    expect(flexContainer).toBeInTheDocument();

    const sidebar = flexContainer?.querySelector('[data-testid="sidebar"]');
    expect(sidebar).toBeInTheDocument();

    const main = flexContainer?.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
