/**
 * MUI & Emotion test setup
 * Provides proper mocks and configuration for testing MUI v7 components with Emotion
 */

import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, RenderOptions } from '@testing-library/react';
import React from 'react';

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver for responsive components
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Create default test theme
export const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    success: { main: '#2e7d32' },
    info: { main: '#0288d1' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Helper to render components with ThemeProvider
export function renderWithTheme(
  ui: React.ReactElement,
  theme: any = testTheme
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };
  return {
    ...render(ui, { wrapper } as RenderOptions),
    theme,
  };
}

// Helper to render components with multiple providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: {
    theme?: any;
    providers?: Array<{ Provider: any; props?: any }>;
  } = {}
) {
  const { theme = testTheme, providers = [] } = options;

  let Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };

  // Wrap additional providers in reverse order (so first provider is outermost)
  for (const provider of [...providers].reverse()) {
    const PreviousWrapper = Wrapper;
    const { Provider, props = {} } = provider;
    Wrapper = ({ children }) => {
      return React.createElement(
        Provider,
        props,
        React.createElement(PreviousWrapper, null, children)
      );
    };
  }

  return {
    ...render(ui, { wrapper } as RenderOptions),
    theme,
  };
}
