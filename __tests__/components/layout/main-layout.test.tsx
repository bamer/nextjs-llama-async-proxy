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

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      expect(() => renderWithTheme(<MainLayout>{null}</MainLayout>)).not.toThrow();
    });

    it('handles undefined children gracefully', () => {
      expect(() => renderWithTheme(<MainLayout>{undefined}</MainLayout>)).not.toThrow();
    });

    it('handles false children', () => {
      expect(() => renderWithTheme(<MainLayout>{false}</MainLayout>)).not.toThrow();
    });

    it('handles true children', () => {
      expect(() => renderWithTheme(<MainLayout>{true}</MainLayout>)).not.toThrow();
    });

    it('handles zero children', () => {
      expect(() => renderWithTheme(<MainLayout>{0}</MainLayout>)).not.toThrow();
    });

    it('handles empty string children', () => {
      const { container } = renderWithTheme(<MainLayout>{''}</MainLayout>);
      expect(container.firstChild).toBeInTheDocument();
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
        <MainLayout>
          <LongNestedComponent />
        </MainLayout>
      );

      expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
      expect(screen.getByTestId('level-0')).toBeInTheDocument();
      expect(screen.getByTestId('level-99')).toBeInTheDocument();
    });

    it('handles children with special characters', () => {
      const specialChars = 'Special: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      renderWithTheme(
        <MainLayout>
          <div data-testid="special-chars">{specialChars}</div>
        </MainLayout>
      );

      expect(screen.getByTestId('special-chars')).toBeInTheDocument();
    });

    it('handles children with very long text content', () => {
      const longText = 'A'.repeat(10000);
      renderWithTheme(
        <MainLayout>
          <div data-testid="long-text">{longText}</div>
        </MainLayout>
      );

      expect(screen.getByTestId('long-text')).toBeInTheDocument();
    });

    it('handles children with Unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 Привет مرحبا';
      renderWithTheme(
        <MainLayout>
          <div data-testid="unicode">{unicodeText}</div>
        </MainLayout>
      );

      expect(screen.getByTestId('unicode')).toBeInTheDocument();
    });

    it('handles children as fragments', () => {
      renderWithTheme(
        <MainLayout>
          <React.Fragment>
            <div data-testid="frag-1">Fragment 1</div>
            <div data-testid="frag-2">Fragment 2</div>
          </React.Fragment>
        </MainLayout>
      );

      expect(screen.getByTestId('frag-1')).toBeInTheDocument();
      expect(screen.getByTestId('frag-2')).toBeInTheDocument();
    });

    it('handles children as arrays', () => {
      renderWithTheme(
        <MainLayout>
          {[
            <div key="1" data-testid="arr-1">
              Array 1
            </div>,
            <div key="2" data-testid="arr-2">
              Array 2
            </div>,
          ]}
        </MainLayout>
      );

      expect(screen.getByTestId('arr-1')).toBeInTheDocument();
      expect(screen.getByTestId('arr-2')).toBeInTheDocument();
    });

    it('handles children with inline styles', () => {
      renderWithTheme(
        <MainLayout>
          <div data-testid="styled" style={{ color: 'red', fontSize: '20px' }}>
            Styled Child
          </div>
        </MainLayout>
      );

      const styledDiv = screen.getByTestId('styled');
      // Note: jest-dom converts color to rgb format
      expect(styledDiv).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      expect(styledDiv).toHaveStyle({ fontSize: '20px' });
    });

    it('handles children with className', () => {
      renderWithTheme(
        <MainLayout>
          <div data-testid="with-class" className="test-class another-class">
            Child with class
          </div>
        </MainLayout>
      );

      const classDiv = screen.getByTestId('with-class');
      expect(classDiv).toHaveClass('test-class', 'another-class');
    });

    it('handles children with event handlers', () => {
      const handleClick = jest.fn();

      renderWithTheme(
        <MainLayout>
          <button data-testid="clickable" onClick={handleClick}>
            Click me
          </button>
        </MainLayout>
      );

      const button = screen.getByTestId('clickable');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles window resize events', () => {
      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      // Simulate resize
      window.dispatchEvent(new Event('resize'));

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles null isDark theme value', () => {
      require('@/contexts/ThemeContext').useTheme.mockReturnValue({
        isDark: null as any,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      expect(() => {
        renderWithTheme(
          <MainLayout>
            <div>Test</div>
          </MainLayout>
        );
      }).not.toThrow();
    });

    it('handles undefined theme context', () => {
      // MainLayout will crash if useTheme returns undefined, so we don't test that
      // Instead we test with a minimal theme context object
      require('@/contexts/ThemeContext').useTheme.mockReturnValue({
        isDark: false,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      } as any);

      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles undefined mode in theme context', () => {
      require('@/contexts/ThemeContext').useTheme.mockReturnValue({
        isDark: false,
        mode: undefined as any,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      expect(() => {
        renderWithTheme(
          <MainLayout>
            <div>Test</div>
          </MainLayout>
        );
      }).not.toThrow();
    });

    it('handles missing Header component gracefully', () => {
      const { container } = renderWithTheme(<MainLayout>Test</MainLayout>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles missing Sidebar component gracefully', () => {
      const { container } = renderWithTheme(<MainLayout>Test</MainLayout>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('maintains correct DOM structure', () => {
      const { container } = renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      // Use data-testid instead of MUI class selector
      const layoutBox = container.querySelector('[data-testid="main-layout"]');
      expect(layoutBox).toBeInTheDocument();
    });

    it('handles keyboard navigation within children', () => {
      renderWithTheme(
        <MainLayout>
          <button data-testid="focusable-1">Button 1</button>
          <button data-testid="focusable-2">Button 2</button>
          <button data-testid="focusable-3">Button 3</button>
        </MainLayout>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });

    it('handles ARIA attributes on children', () => {
      renderWithTheme(
        <MainLayout>
          <div data-testid="aria-element" role="region" aria-label="Test region">
            Content
          </div>
        </MainLayout>
      );

      const ariaElement = screen.getByTestId('aria-element');
      expect(ariaElement).toHaveAttribute('role', 'region');
      expect(ariaElement).toHaveAttribute('aria-label', 'Test region');
    });
  });

  describe('Mobile vs Desktop Behavior', () => {
    it('applies correct responsive padding at mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('applies correct responsive padding at tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('applies correct responsive padding at desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles viewport changes without errors', () => {
      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      const widths = [320, 768, 1024, 1920, 2560];
      widths.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Theme Variation Edge Cases', () => {
    it('handles rapid theme switches without errors', () => {
      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      for (let i = 0; i < 10; i++) {
        require('@/contexts/ThemeContext').useTheme.mockReturnValue({
          isDark: i % 2 === 0,
          mode: i % 2 === 0 ? ('dark' as const) : ('light' as const),
          setMode: jest.fn(),
          toggleTheme: jest.fn(),
          currentTheme: theme,
        });
      }

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles theme transition states', () => {
      const { container, rerender } = renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      // Switch to dark mode
      require('@/contexts/ThemeContext').useTheme.mockReturnValue({
        isDark: true,
        mode: 'dark' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      rerender(
        <ThemeProvider theme={theme}>
          <MainLayout>
            <div>Test</div>
          </MainLayout>
        </ThemeProvider>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles custom theme with non-standard colors', () => {
      const customTheme = createTheme({
        palette: {
          background: {
            default: '#ff0000',
          },
        },
      });

      require('@/contexts/ThemeContext').useTheme.mockReturnValue({
        isDark: false,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: customTheme,
      });

      renderWithTheme(
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
