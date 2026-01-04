import React from "react";
import { render } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSidebar } from '@/components/layout/SidebarProvider';

jest.mock('@/components/layout/SidebarProvider', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  useSidebar: jest.fn().mockImplementation(() => ({
    isOpen: false,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: jest.fn(),
  })),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

export const theme = createTheme();

export function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}
