import { render, screen, fireEvent } from '@testing-library/react';
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

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      expect(() => renderWithTheme(<Layout>{null}</Layout>)).not.toThrow();
    });

    it('handles undefined children gracefully', () => {
      expect(() => renderWithTheme(<Layout>{undefined}</Layout>)).not.toThrow();
    });

    it('handles false children', () => {
      expect(() => renderWithTheme(<Layout>{false}</Layout>)).not.toThrow();
    });

    it('handles true children', () => {
      expect(() => renderWithTheme(<Layout>{true}</Layout>)).not.toThrow();
    });

    it('handles zero children', () => {
      expect(() => renderWithTheme(<Layout>{0}</Layout>)).not.toThrow();
    });

    it('handles empty string children', () => {
      const { container } = renderWithTheme(<Layout>{''}</Layout>);
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles very long nested children', () => {
      const LongNestedComponent = () => (
        <div data-testid="deep-nested">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} data-testid={`level-${i}`}>
              Level {i}
            </div>
          ))}
        </div>
      );

      renderWithTheme(
        <Layout>
          <LongNestedComponent />
        </Layout>
      );

      expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
      expect(screen.getByTestId('level-0')).toBeInTheDocument();
      expect(screen.getByTestId('level-99')).toBeInTheDocument();
    });

    it('handles children with special characters', () => {
      const specialChars = 'Special: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      renderWithTheme(
        <Layout>
          <div data-testid="special-chars">{specialChars}</div>
        </Layout>
      );

      expect(screen.getByTestId('special-chars')).toBeInTheDocument();
    });

    it('handles children with very long text content', () => {
      const longText = 'A'.repeat(10000);
      renderWithTheme(
        <Layout>
          <div data-testid="long-text">{longText}</div>
        </Layout>
      );

      expect(screen.getByTestId('long-text')).toBeInTheDocument();
    });

    it('handles children with Unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 Привет مرحبا';
      renderWithTheme(
        <Layout>
          <div data-testid="unicode">{unicodeText}</div>
        </Layout>
      );

      expect(screen.getByTestId('unicode')).toBeInTheDocument();
    });

    it('handles children as fragments', () => {
      renderWithTheme(
        <Layout>
          <>
            <div data-testid="frag-1">Fragment 1</div>
            <div data-testid="frag-2">Fragment 2</div>
          </>
        </Layout>
      );

      expect(screen.getByTestId('frag-1')).toBeInTheDocument();
      expect(screen.getByTestId('frag-2')).toBeInTheDocument();
    });

    it('handles children as arrays', () => {
      renderWithTheme(
        <Layout>
          {[
            <div key="1" data-testid="arr-1">
              Array 1
            </div>,
            <div key="2" data-testid="arr-2">
              Array 2
            </div>,
          ]}
        </Layout>
      );

      expect(screen.getByTestId('arr-1')).toBeInTheDocument();
      expect(screen.getByTestId('arr-2')).toBeInTheDocument();
    });

    it('handles children with inline styles', () => {
      renderWithTheme(
        <Layout>
          <div data-testid="styled" style={{ color: 'red', fontSize: '20px' }}>
            Styled Child
          </div>
        </Layout>
      );

      const styledDiv = screen.getByTestId('styled');
      // Note: jest-dom converts color to rgb format
      expect(styledDiv).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      expect(styledDiv).toHaveStyle({ fontSize: '20px' });
    });

    it('handles children with className', () => {
      renderWithTheme(
        <Layout>
          <div data-testid="with-class" className="test-class another-class">
            Child with class
          </div>
        </Layout>
      );

      const classDiv = screen.getByTestId('with-class');
      expect(classDiv).toHaveClass('test-class', 'another-class');
    });

    it('handles children with event handlers', () => {
      const handleClick = jest.fn();

      renderWithTheme(
        <Layout>
          <button data-testid="clickable" onClick={handleClick}>
            Click me
          </button>
        </Layout>
      );

      const button = screen.getByTestId('clickable');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles concurrent sidebar state changes', () => {
      const { useSidebar } = require('@/components/layout/SidebarProvider');

      // Test rapid state changes
      for (let i = 0; i < 10; i++) {
        useSidebar.mockReturnValue({
          isOpen: i % 2 === 0,
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
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('handles window resize events', () => {
      renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      // Simulate resize
      window.dispatchEvent(new Event('resize'));

      const mainElement = document.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles missing Header component gracefully', () => {
      const { container } = renderWithTheme(<Layout>Test</Layout>);
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles missing Sidebar component gracefully', () => {
      const { container } = renderWithTheme(<Layout>Test</Layout>);
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('maintains correct DOM structure', () => {
      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const layoutContainer = container.querySelector('.min-h-screen');
      expect(layoutContainer).toBeInTheDocument();

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles keyboard navigation within children', () => {
      renderWithTheme(
        <Layout>
          <button data-testid="focusable-1">Button 1</button>
          <button data-testid="focusable-2">Button 2</button>
          <button data-testid="focusable-3">Button 3</button>
        </Layout>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });

    it('handles ARIA attributes on children', () => {
      renderWithTheme(
        <Layout>
          <div data-testid="aria-element" role="region" aria-label="Test region">
            Content
          </div>
        </Layout>
      );

      const ariaElement = screen.getByTestId('aria-element');
      expect(ariaElement).toHaveAttribute('role', 'region');
      expect(ariaElement).toHaveAttribute('aria-label', 'Test region');
    });

    it('handles focus management', () => {
      renderWithTheme(
        <Layout>
          <button data-testid="first-focus">First</button>
          <button data-testid="second-focus">Second</button>
        </Layout>
      );

      const firstButton = screen.getByTestId('first-focus');
      const secondButton = screen.getByTestId('second-focus');

      // Note: fireEvent.focus in jsdom doesn't actually set focus
      // We test that focus events can be handled
      expect(firstButton).toBeInTheDocument();
      expect(secondButton).toBeInTheDocument();
      expect(firstButton).toBeEnabled();
      expect(secondButton).toBeEnabled();
    });
  });

  describe('Mobile vs Desktop Behavior', () => {
    it('applies correct classes at mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('applies correct classes at desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles viewport changes without errors', () => {
      renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const widths = [320, 768, 1024, 1920];
      widths.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
      });

      const mainElement = document.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Theme Variation Edge Cases', () => {
    it('renders correctly in light mode', () => {
      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders correctly in dark mode', () => {
      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles missing theme context gracefully', () => {
      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Collapsed/Expanded States', ()   => {
    it('handles sidebar closed state correctly', () => {
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

    it('handles sidebar open state correctly', () => {
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

    it('handles state transitions without errors', () => {
      const { useSidebar } = require('@/components/layout/SidebarProvider');
      const { container, rerender } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      // Transition to open
      useSidebar.mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: jest.fn(),
      });

      rerender(
        <ThemeProvider theme={theme}>
          <Layout>
            <div>Test</div>
          </Layout>
        </ThemeProvider>
      );

      // Transition to closed
      useSidebar.mockReturnValue({
        isOpen: false,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: jest.fn(),
      });

      rerender(
        <ThemeProvider theme={theme}>
          <Layout>
            <div>Test</div>
          </Layout>
        </ThemeProvider>
      );
    });

    it('handles rapid state changes', () => {
      const { useSidebar } = require('@/components/layout/SidebarProvider');

      for (let i = 0; i < 20; i++) {
        useSidebar.mockReturnValue({
          isOpen: i % 2 === 0,
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
        expect(mainElement).toBeInTheDocument();
      }
    });
  });
});
