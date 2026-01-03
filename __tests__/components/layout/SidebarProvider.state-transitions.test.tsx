import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

describe('SidebarProvider - State Transitions Edge Cases', () => {
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

  it('handles repeated open/close cycles', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const openButton = screen.getByTestId('open');
    const closeButton = screen.getByTestId('close');
    const isOpenSpan = screen.getByTestId('is-open');

    for (let i = 0; i < 30; i++) {
      act(() => {
        openButton.click();
        closeButton.click();
      });
    }

    expect(isOpenSpan).toHaveTextContent('false');
  });

  it('handles calling open when already open', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const openButton = screen.getByTestId('open');
    const isOpenSpan = screen.getByTestId('is-open');

    act(() => openButton.click());
    expect(isOpenSpan).toHaveTextContent('true');

    act(() => openButton.click());
    expect(isOpenSpan).toHaveTextContent('true');
  });

  it('handles calling close when already closed', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const closeButton = screen.getByTestId('close');
    const isOpenSpan = screen.getByTestId('is-open');

    act(() => closeButton.click());
    expect(isOpenSpan).toHaveTextContent('false');

    act(() => closeButton.click());
    expect(isOpenSpan).toHaveTextContent('false');
  });

  it('handles toggle in rapid succession from both open and closed states', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    const isOpenSpan = screen.getByTestId('is-open');

    act(() => toggleButton.click());
    expect(isOpenSpan).toHaveTextContent('true');

    for (let i = 0; i < 20; i++) {
      act(() => toggleButton.click());
    }

    expect(isOpenSpan).toHaveTextContent('true');
  });

  it('handles concurrent toggle, open, and close operations', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    const openButton = screen.getByTestId('open');
    const closeButton = screen.getByTestId('close');

    act(() => {
      openButton.click();
      closeButton.click();
      toggleButton.click();
      openButton.click();
      toggleButton.click();
    });

    expect(toggleButton).toBeInTheDocument();
  });
});
