import { render, screen } from '@testing-library/react';
import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

/**
 * Test component that renders sidebar state and controls
 */
export const createTestComponent = () => {
  const TestComponent = () => {
    const sidebar = useSidebar();
    return (
      <div>
        <span data-testid="is-open">{String(sidebar.isOpen)}</span>
        <button onClick={sidebar.toggleSidebar} data-testid="toggle">
          Toggle
        </button>
        <button onClick={sidebar.openSidebar} data-testid="open">
          Open
        </button>
        <button onClick={sidebar.closeSidebar} data-testid="close">
          Close
        </button>
      </div>
    );
  };
  return TestComponent;
};

/**
 * Render SidebarProvider with a test component
 */
export const renderSidebarProvider = (children?: React.ReactNode) => {
  return render(<SidebarProvider>{children}</SidebarProvider>);
};

/**
 * Get standard test elements from DOM
 */
export const getTestElements = () => {
  return {
    isOpenSpan: screen.getByTestId('is-open'),
    toggleButton: screen.getByTestId('toggle'),
    openButton: screen.getByTestId('open'),
    closeButton: screen.getByTestId('close'),
  };
};
