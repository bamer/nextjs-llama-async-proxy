import { render } from '@testing-library/react';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('@/contexts/ThemeContext');

const theme = createTheme();

/**
 * Mock form configuration for GeneralSettingsTab tests
 */
export const defaultFormConfig = {
  basePath: '/models',
  logLevel: 'info',
  maxConcurrentModels: 5,
  autoUpdate: true,
  notificationsEnabled: false,
  llamaServerPath: '/path/to/llama-server',
};

/**
 * Default empty field errors
 */
export const defaultFieldErrors: Record<string, string> = {};

/**
 * Render a component with MUI theme provider
 */
export function renderWithTheme(component: React.ReactElement) {
  return render(React.createElement(ThemeProvider, { theme }, component));
}

/**
 * Setup theme context mock for light theme
 */
export function setupLightThemeMock(): void {
  jest.mocked(useTheme).mockReturnValue({
    isDark: false,
    mode: 'light' as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });
}

/**
 * Setup theme context mock for dark theme
 */
export function setupDarkThemeMock(): void {
  jest.mocked(useTheme).mockReturnValue({
    isDark: true,
    mode: 'dark' as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });
}

/**
 * Clear all mocks before each test
 */
export function clearAllMocks(): void {
  jest.clearAllMocks();
}
