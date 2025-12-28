import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('SidebarProvider - Comprehensive Tests', () => {
  describe('Context Provider', () => {
    it('renders children correctly', () => {
      renderWithTheme(
        <SidebarProvider>
          <div data-testid="test-child">Test Content</div>
        </SidebarProvider>
      );
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('provides context value to children', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
            <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
            <button onClick={sidebar.closeSidebar} data-testid="close">Close</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    });
  });

  describe('Initial State', () => {
    it('initializes with isOpen as false', () => {
      const TestComponent = () => {
        const { isOpen } = useSidebar();
        return <span data-testid="is-open">{String(isOpen)}</span>;
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    });

    it('provides all required context methods', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="has-isOpen">{String(typeof sidebar.isOpen === 'boolean')}</span>
            <span data-testid="has-toggle">{String(typeof sidebar.toggleSidebar === 'function')}</span>
            <span data-testid="has-open">{String(typeof sidebar.openSidebar === 'function')}</span>
            <span data-testid="has-close">{String(typeof sidebar.closeSidebar === 'function')}</span>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      expect(screen.getByTestId('has-isOpen')).toHaveTextContent('true');
      expect(screen.getByTestId('has-toggle')).toHaveTextContent('true');
      expect(screen.getByTestId('has-open')).toHaveTextContent('true');
      expect(screen.getByTestId('has-close')).toHaveTextContent('true');
    });
  });

  describe('Toggle Functionality', () => {
    it('toggles sidebar state when toggleSidebar is called', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const isOpenSpan = screen.getByTestId('is-open');

      expect(isOpenSpan).toHaveTextContent('false');

      fireEvent.click(toggleButton);
      expect(isOpenSpan).toHaveTextContent('true');

      fireEvent.click(toggleButton);
      expect(isOpenSpan).toHaveTextContent('false');
    });

    it('toggles multiple times correctly', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const isOpenSpan = screen.getByTestId('is-open');

      for (let i = 1; i <= 5; i++) {
        fireEvent.click(toggleButton);
        expect(isOpenSpan).toHaveTextContent(i % 2 === 0 ? 'false' : 'true');
      }
    });
  });

  describe('Open Functionality', () => {
    it('opens sidebar when openSidebar is called', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const openButton = screen.getByTestId('open');
      const isOpenSpan = screen.getByTestId('is-open');

      expect(isOpenSpan).toHaveTextContent('false');

      fireEvent.click(openButton);
      expect(isOpenSpan).toHaveTextContent('true');
    });

    it('does not change state if already open', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const openButton = screen.getByTestId('open');
      const isOpenSpan = screen.getByTestId('is-open');

      fireEvent.click(openButton);
      expect(isOpenSpan).toHaveTextContent('true');

      fireEvent.click(openButton);
      expect(isOpenSpan).toHaveTextContent('true');
    });
  });

  describe('Close Functionality', () => {
    it('closes sidebar when closeSidebar is called', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
            <button onClick={sidebar.closeSidebar} data-testid="close">Close</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const openButton = screen.getByTestId('open');
      const closeButton = screen.getByTestId('close');
      const isOpenSpan = screen.getByTestId('is-open');

      fireEvent.click(openButton);
      expect(isOpenSpan).toHaveTextContent('true');

      fireEvent.click(closeButton);
      expect(isOpenSpan).toHaveTextContent('false');
    });

    it('does not change state if already closed', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.closeSidebar} data-testid="close">Close</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const closeButton = screen.getByTestId('close');
      const isOpenSpan = screen.getByTestId('is-open');

      expect(isOpenSpan).toHaveTextContent('false');

      fireEvent.click(closeButton);
      expect(isOpenSpan).toHaveTextContent('false');
    });
  });

  describe('State Persistence', () => {
    it('maintains state across re-renders', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
          </div>
        );
      };

      const { rerender } = renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const isOpenSpan = screen.getByTestId('is-open');

      expect(isOpenSpan).toHaveTextContent('false');

      fireEvent.click(toggleButton);
      expect(isOpenSpan).toHaveTextContent('true');

      rerender(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      expect(isOpenSpan).toHaveTextContent('true');
    });
  });

  describe('Error Handling', () => {
    it('throws error when useSidebar is used outside SidebarProvider', () => {
      // Suppress console.error for this test
      const consoleError = console.error;
      console.error = jest.fn();

      const TestComponent = () => {
        const { useSidebar: _useSidebar } = require('@/components/layout/SidebarProvider');
        _useSidebar();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSidebar must be used within SidebarProvider');

      console.error = consoleError;
    });
  });

  describe('Multiple Providers', () => {
    it('maintains separate state for each provider instance', () => {
      const TestComponent1 = () => {
        const sidebar = useSidebar();
        return (
          <div data-testid="provider-1">
            <span data-testid="state-1">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle-1">Toggle 1</button>
          </div>
        );
      };

      const TestComponent2 = () => {
        const sidebar = useSidebar();
        return (
          <div data-testid="provider-2">
            <span data-testid="state-2">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle-2">Toggle 2</button>
          </div>
        );
      };

      renderWithTheme(
        <>
          <SidebarProvider>
            <TestComponent1 />
          </SidebarProvider>
          <SidebarProvider>
            <TestComponent2 />
          </SidebarProvider>
        </>
      );

      const state1 = screen.getByTestId('state-1');
      const state2 = screen.getByTestId('state-2');
      const toggle1 = screen.getByTestId('toggle-1');
      const toggle2 = screen.getByTestId('toggle-2');

      expect(state1).toHaveTextContent('false');
      expect(state2).toHaveTextContent('false');

      fireEvent.click(toggle1);
      expect(state1).toHaveTextContent('true');
      expect(state2).toHaveTextContent('false');

      fireEvent.click(toggle2);
      expect(state1).toHaveTextContent('true');
      expect(state2).toHaveTextContent('true');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles rapid toggle operations', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const isOpenSpan = screen.getByTestId('is-open');

      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
      }

      // Should end in false (even number of toggles)
      expect(isOpenSpan).toHaveTextContent('false');
    });

    it('handles mixed open/close operations', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
            <button onClick={sidebar.closeSidebar} data-testid="close">Close</button>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
          </div>
        );
      };

      renderWithTheme(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const isOpenSpan = screen.getByTestId('is-open');

      expect(isOpenSpan).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('open'));
      expect(isOpenSpan).toHaveTextContent('true');

      fireEvent.click(screen.getByTestId('toggle'));
      expect(isOpenSpan).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('open'));
      expect(isOpenSpan).toHaveTextContent('true');

      fireEvent.click(screen.getByTestId('close'));
      expect(isOpenSpan).toHaveTextContent('false');
    });
  });
});
