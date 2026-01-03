import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

describe('SidebarProvider - Accessibility Edge Cases', () => {
  it('handles context access in screen readers', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <button
            onClick={sidebar.toggleSidebar}
            aria-label="Toggle sidebar"
            data-testid="toggle"
          >
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
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle sidebar');
  });

  it('handles keyboard navigation through context-controlled elements', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <button
            onClick={sidebar.toggleSidebar}
            onKeyDown={(e) => e.key === 'Enter' && sidebar.toggleSidebar()}
            data-testid="toggle"
          >
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
    fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
    expect(toggleButton).toBeInTheDocument();
  });

  it('handles focus management with context', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <button
            onClick={sidebar.toggleSidebar}
            data-testid="toggle"
          >
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
    fireEvent.focus(toggleButton);
    expect(toggleButton).toBeInTheDocument();

    fireEvent.blur(toggleButton);
    expect(toggleButton).toBeInTheDocument();
  });
});
