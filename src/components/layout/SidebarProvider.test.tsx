import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarProvider, useSidebar } from './SidebarProvider';

// Test component that uses the sidebar context
function TestComponent() {
  const { isOpen, toggleSidebar, openSidebar, closeSidebar } = useSidebar();

  return (
    <div>
      <div data-testid="sidebar-state">{isOpen ? 'open' : 'closed'}</div>
      <button onClick={toggleSidebar} data-testid="toggle-btn">Toggle</button>
      <button onClick={openSidebar} data-testid="open-btn">Open</button>
      <button onClick={closeSidebar} data-testid="close-btn">Close</button>
    </div>
  );
}

describe('SidebarProvider', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <SidebarProvider>
        {component}
      </SidebarProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Creation', () => {
    it('provides sidebar context to children', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('sidebar-state')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-btn')).toBeInTheDocument();
      expect(screen.getByTestId('open-btn')).toBeInTheDocument();
      expect(screen.getByTestId('close-btn')).toBeInTheDocument();
    });

    it('initializes with sidebar closed', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
    });
  });

  describe('Sidebar State Management', () => {
    it('toggles sidebar state when toggleSidebar is called', () => {
      renderWithProvider(<TestComponent />);

      const stateDisplay = screen.getByTestId('sidebar-state');
      const toggleBtn = screen.getByTestId('toggle-btn');

      // Initially closed
      expect(stateDisplay).toHaveTextContent('closed');

      // Toggle to open
      fireEvent.click(toggleBtn);
      expect(stateDisplay).toHaveTextContent('open');

      // Toggle back to closed
      fireEvent.click(toggleBtn);
      expect(stateDisplay).toHaveTextContent('closed');
    });

    it('opens sidebar when openSidebar is called', () => {
      renderWithProvider(<TestComponent />);

      const stateDisplay = screen.getByTestId('sidebar-state');
      const openBtn = screen.getByTestId('open-btn');

      expect(stateDisplay).toHaveTextContent('closed');

      fireEvent.click(openBtn);
      expect(stateDisplay).toHaveTextContent('open');
    });

    it('closes sidebar when closeSidebar is called', () => {
      renderWithProvider(<TestComponent />);

      const stateDisplay = screen.getByTestId('sidebar-state');
      const openBtn = screen.getByTestId('open-btn');
      const closeBtn = screen.getByTestId('close-btn');

      // Open first
      fireEvent.click(openBtn);
      expect(stateDisplay).toHaveTextContent('open');

      // Then close
      fireEvent.click(closeBtn);
      expect(stateDisplay).toHaveTextContent('closed');
    });

    it('maintains state independently for multiple operations', () => {
      renderWithProvider(<TestComponent />);

      const stateDisplay = screen.getByTestId('sidebar-state');
      const toggleBtn = screen.getByTestId('toggle-btn');
      const closeBtn = screen.getByTestId('close-btn');

      // Toggle multiple times
      fireEvent.click(toggleBtn); // open
      expect(stateDisplay).toHaveTextContent('open');

      fireEvent.click(closeBtn); // explicitly close
      expect(stateDisplay).toHaveTextContent('closed');

      fireEvent.click(toggleBtn); // toggle back to open
      expect(stateDisplay).toHaveTextContent('open');
    });
  });

  describe('useSidebar Hook', () => {
    it('returns all required context methods', () => {
      renderWithProvider(<TestComponent />);

      // The component renders successfully, which means useSidebar returns the expected interface
      expect(screen.getByTestId('sidebar-state')).toBeInTheDocument();
    });

    it('throws error when used outside provider', () => {
      // Mock console.error to avoid test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSidebar must be used within SidebarProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Context Isolation', () => {
    it('provides independent context instances', () => {
      function IndependentComponent() {
        const { isOpen, toggleSidebar } = useSidebar();
        return (
          <div>
            <span data-testid="independent-state">{isOpen ? 'open' : 'closed'}</span>
            <button onClick={toggleSidebar} data-testid="independent-toggle">Toggle Independent</button>
          </div>
        );
      }

      render(
        <div>
          <SidebarProvider>
            <TestComponent />
          </SidebarProvider>
          <SidebarProvider>
            <IndependentComponent />
          </SidebarProvider>
        </div>
      );

      const firstState = screen.getAllByTestId('sidebar-state')[0];
      const secondState = screen.getByTestId('independent-state');
      const firstToggle = screen.getByTestId('toggle-btn');
      const secondToggle = screen.getByTestId('independent-toggle');

      // Both start closed
      expect(firstState).toHaveTextContent('closed');
      expect(secondState).toHaveTextContent('closed');

      // Toggle first provider
      fireEvent.click(firstToggle);
      expect(firstState).toHaveTextContent('open');
      expect(secondState).toHaveTextContent('closed'); // Second remains unchanged

      // Toggle second provider
      fireEvent.click(secondToggle);
      expect(firstState).toHaveTextContent('open'); // First remains open
      expect(secondState).toHaveTextContent('open'); // Second opens
    });
  });

  describe('State Persistence', () => {
    it('maintains state across re-renders', () => {
      const { rerender } = renderWithProvider(<TestComponent />);

      const stateDisplay = screen.getByTestId('sidebar-state');
      const toggleBtn = screen.getByTestId('toggle-btn');

      // Toggle to open
      fireEvent.click(toggleBtn);
      expect(stateDisplay).toHaveTextContent('open');

      // Re-render the same component
      rerender(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      // State should be preserved
      expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');
    });

    it('resets state when provider is remounted', () => {
      const { rerender } = renderWithProvider(<TestComponent />);

      const stateDisplay = screen.getByTestId('sidebar-state');
      const toggleBtn = screen.getByTestId('toggle-btn');

      // Toggle to open
      fireEvent.click(toggleBtn);
      expect(stateDisplay).toHaveTextContent('open');

      // Remount provider (different key would cause this in real usage)
      rerender(
        <SidebarProvider key="new-provider">
          <TestComponent />
        </SidebarProvider>
      );

      // State should reset to initial (closed)
      expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
    });
  });
});