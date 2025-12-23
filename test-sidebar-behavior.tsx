import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainLayout } from '@/components/layout/main-layout';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';

describe('Sidebar Behavior', () => {
  test('Sidebar is closed by default', () => {
    render(
      <ThemeProvider>
        <SidebarProvider>
          <MainLayout>
            <div>Test Content</div>
          </MainLayout>
        </SidebarProvider>
      </ThemeProvider>
    );

    // Sidebar should not be visible by default
    const sidebar = screen.queryByRole('navigation');
    expect(sidebar).not.toBeVisible();
  });

  test('Header button can open sidebar', () => {
    render(
      <ThemeProvider>
        <SidebarProvider>
          <Header />
          <Sidebar />
          <div>Test Content</div>
        </SidebarProvider>
      </ThemeProvider>
    );

    // Find and click the menu button
    const menuButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(menuButton);

    // Sidebar should now be visible
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeVisible();
  });

  test('Sidebar close button can close sidebar', () => {
    render(
      <ThemeProvider>
        <SidebarProvider>
          <Header />
          <Sidebar />
          <div>Test Content</div>
        </SidebarProvider>
      </ThemeProvider>
    );

    // Open sidebar first
    const menuButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(menuButton);

    // Find and click the close button in sidebar
    const closeButton = screen.getByLabelText('Close sidebar');
    fireEvent.click(closeButton);

    // Sidebar should be closed again
    const sidebar = screen.queryByRole('navigation');
    expect(sidebar).not.toBeVisible();
  });

  test('Content takes full width when sidebar is closed', () => {
    render(
      <ThemeProvider>
        <SidebarProvider>
          <MainLayout>
            <div data-testid="content">Test Content</div>
          </MainLayout>
        </SidebarProvider>
      </ThemeProvider>
    );

    const content = screen.getByTestId('content');
    // Content should take full width when sidebar is closed
    expect(content).toHaveStyle('width: 100%');
  });
});