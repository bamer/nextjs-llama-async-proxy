import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

describe('SidebarProvider - Edge Cases', () => {
  it('handles null children gracefully', () => {
    expect(() => {
      render(
        <SidebarProvider>
          {null}
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('handles undefined children gracefully', () => {
    expect(() => {
      render(
        <SidebarProvider>
          {undefined}
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('handles false children', () => {
    expect(() => {
      render(
        <SidebarProvider>
          {false}
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('handles true children', () => {
    expect(() => {
      render(
        <SidebarProvider>
          {true}
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('handles zero children', () => {
    expect(() => {
      render(
        <SidebarProvider>
          {0}
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('handles empty string children', () => {
    render(
      <SidebarProvider>
        {''}
      </SidebarProvider>
    );
  });

  it('handles children as fragments', () => {
    render(
      <SidebarProvider>
        <React.Fragment>
          <div data-testid="frag-1">Fragment 1</div>
          <div data-testid="frag-2">Fragment 2</div>
        </React.Fragment>
      </SidebarProvider>
    );

    expect(screen.getByTestId('frag-1')).toBeInTheDocument();
    expect(screen.getByTestId('frag-2')).toBeInTheDocument();
  });

  it('handles children as arrays', () => {
    render(
      <SidebarProvider>
        {[
          <div key="1" data-testid="arr-1">
            Array 1
          </div>,
          <div key="2" data-testid="arr-2">
            Array 2
          </div>,
        ]}
      </SidebarProvider>
    );

    expect(screen.getByTestId('arr-1')).toBeInTheDocument();
    expect(screen.getByTestId('arr-2')).toBeInTheDocument();
  });

  it('handles rapid state changes without errors', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <button onClick={sidebar.toggleSidebar} data-testid="toggle">
            Toggle
          </button>
        </div>
      );
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');

    for (let i = 0; i < 50; i++) {
      act(() => {
        toggleButton.click();
      });
    }

    expect(toggleButton).toBeInTheDocument();
  });

  it('handles multiple children using context', () => {
    const Child = ({ id }: { id: string }) => {
      const sidebar = useSidebar();
      return (
        <div data-testid={id}>
          <span data-testid={`${id}-is-open`}>{String(sidebar.isOpen)}</span>
          <button
            onClick={sidebar.toggleSidebar}
            data-testid={`${id}-toggle`}
          >
            Toggle
          </button>
        </div>
      );
    };

    render(
      <SidebarProvider>
        <Child id="child-1" />
        <Child id="child-2" />
      </SidebarProvider>
    );

    expect(screen.getByTestId('child-1-is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('child-2-is-open')).toHaveTextContent('false');

    act(() => {
      screen.getByTestId('child-1-toggle').click();
    });

    expect(screen.getByTestId('child-1-is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('child-2-is-open')).toHaveTextContent('true');
  });

  it('handles children with event handlers', () => {
    const handleClick = jest.fn();

    render(
      <SidebarProvider>
        <button data-testid="clickable" onClick={handleClick}>
          Click me
        </button>
      </SidebarProvider>
    );

    const button = screen.getByTestId('clickable');
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
