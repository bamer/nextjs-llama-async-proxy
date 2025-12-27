import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

describe('SidebarProvider', () => {
  it('renders children correctly', () => {
    render(
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

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('initializes with isOpen as false', () => {
    const TestComponent = () => {
      const { isOpen } = useSidebar();
      return <span data-testid="is-open">{String(isOpen)}</span>;
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

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

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    const isOpenSpan = screen.getByTestId('is-open');

    expect(isOpenSpan).toHaveTextContent('false');

    act(() => {
      toggleButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');

    act(() => {
      toggleButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('false');
  });

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

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const openButton = screen.getByTestId('open');
    const isOpenSpan = screen.getByTestId('is-open');

    expect(isOpenSpan).toHaveTextContent('false');

    act(() => {
      openButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');
  });

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

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const openButton = screen.getByTestId('open');
    const closeButton = screen.getByTestId('close');
    const isOpenSpan = screen.getByTestId('is-open');

    act(() => {
      openButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');

    act(() => {
      closeButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('false');
  });

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

    const { rerender } = render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    const isOpenSpan = screen.getByTestId('is-open');

    expect(isOpenSpan).toHaveTextContent('false');

    act(() => {
      toggleButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');

    rerender(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(isOpenSpan).toHaveTextContent('true');
  });

  it('provides all required methods', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <button onClick={sidebar.toggleSidebar}>Toggle</button>
          <button onClick={sidebar.openSidebar}>Open</button>
          <button onClick={sidebar.closeSidebar}>Close</button>
        </div>
      );
    };

    expect(() => {
      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('throws error when useSidebar is used outside SidebarProvider', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return <div>{String(sidebar.isOpen)}</div>;
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSidebar must be used within SidebarProvider');
  });
});
