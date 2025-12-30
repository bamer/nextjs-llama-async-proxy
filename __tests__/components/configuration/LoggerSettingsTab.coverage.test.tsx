import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { LoggerSettingsTab } from '../../../src/components/configuration/LoggerSettingsTab';
import * as loggerHook from '@/hooks/use-logger-config';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('framer-motion', () => ({
  m: {
    div: (props: unknown) => {
      const { children } = props as { children?: React.ReactNode };
      return <div>{children}</div>;
    },
  },
}));

jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext');

function renderComponent(component: React.ReactElement) {
  return render(component);
}

describe('LoggerSettingsTab - Coverage Enhancements', () => {
  const mockUpdateConfig = jest.fn();
  const defaultLoggerConfig = {
    enableConsoleLogging: true,
    consoleLevel: 'info',
    enableFileLogging: true,
    fileLevel: 'info',
    errorLevel: 'error',
    maxFileSize: '20m',
    maxFiles: '30d',
  };

  const mockClearFieldError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useTheme).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: {},
    });
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: defaultLoggerConfig,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
  });

  // Test with fieldErrors prop populated
  it('renders error messages when fieldErrors prop is populated', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          consoleLevel: 'Invalid log level',
          fileLevel: 'Invalid file level',
          maxFileSize: 'File size too large',
        }}
      />
    );

    expect(screen.getByText('Invalid log level')).toBeInTheDocument();
    expect(screen.getByText('Invalid file level')).toBeInTheDocument();
    expect(screen.getByText('File size too large')).toBeInTheDocument();
  });

  // Test disabled states based on switches - Console Logging
  it('disables Console Level select when console logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const consoleLevelSelect = screen.getByRole('combobox');
    expect(consoleLevelSelect).toBeDisabled();
  });

  // Test disabled states based on switches - File Logging
  it('disables all file logging selects when file logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    // File Level, Error Level, Max File Size, File Retention should be disabled
    expect(selects[1]).toBeDisabled(); // File Level
    expect(selects[2]).toBeDisabled(); // Error Level
    expect(selects[3]).toBeDisabled(); // Max File Size
    expect(selects[4]).toBeDisabled(); // File Retention
  });

  // Test clearFieldError functionality
  it('calls clearFieldError when console level is changed', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'debug' } });

    expect(mockClearFieldError).toHaveBeenCalledWith('consoleLevel');
  });

  it('calls clearFieldError when file level is changed', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'warn' } });

    expect(mockClearFieldError).toHaveBeenCalledWith('fileLevel');
  });

  it('calls clearFieldError when error level is changed', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'warn' } });

    expect(mockClearFieldError).toHaveBeenCalledWith('errorLevel');
  });

  it('calls clearFieldError when max file size is changed', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[3], { target: { value: '50m' } });

    expect(mockClearFieldError).toHaveBeenCalledWith('maxFileSize');
  });

  it('calls clearFieldError when max files is changed', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[4], { target: { value: '60d' } });

    expect(mockClearFieldError).toHaveBeenCalledWith('maxFiles');
  });

  // Test error message rendering for all fields
  it('renders error message for consoleLevel field', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          consoleLevel: 'Console level error',
        }}
      />
    );

    expect(screen.getByText('Console level error')).toBeInTheDocument();
  });

  it('renders error message for fileLevel field', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          fileLevel: 'File level error',
        }}
      />
    );

    expect(screen.getByText('File level error')).toBeInTheDocument();
  });

  it('renders error message for errorLevel field', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          errorLevel: 'Error level error',
        }}
      />
    );

    expect(screen.getByText('Error level error')).toBeInTheDocument();
  });

  it('renders error message for maxFileSize field', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          maxFileSize: 'Max file size error',
        }}
      />
    );

    expect(screen.getByText('Max file size error')).toBeInTheDocument();
  });

  it('renders error message for maxFiles field', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          maxFiles: 'Max files error',
        }}
      />
    );

    expect(screen.getByText('Max files error')).toBeInTheDocument();
  });

  // Test with all field errors populated
  it('renders all error messages when all fields have errors', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          consoleLevel: 'Console level error',
          fileLevel: 'File level error',
          errorLevel: 'Error level error',
          maxFileSize: 'Max file size error',
          maxFiles: 'Max files error',
        }}
      />
    );

    expect(screen.getByText('Console level error')).toBeInTheDocument();
    expect(screen.getByText('File level error')).toBeInTheDocument();
    expect(screen.getByText('Error level error')).toBeInTheDocument();
    expect(screen.getByText('Max file size error')).toBeInTheDocument();
    expect(screen.getByText('Max files error')).toBeInTheDocument();
  });

  // Test error color styling
  it('applies error color to error messages', () => {
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          consoleLevel: 'Console level error',
        }}
      />
    );

    const errorElement = screen.getByText('Console level error');
    expect(errorElement).toHaveStyle({ color: 'rgb(211, 47, 47)' }); // MUI error color
  });

  // Test console logging disabled with error
  it('displays console level error even when console logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          consoleLevel: 'Console level error',
        }}
      />
    );

    expect(screen.getByText('Console level error')).toBeInTheDocument();
  });

  // Test file logging disabled with error
  it('displays file level error even when file logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(
      <LoggerSettingsTab
        fieldErrors={{
          fileLevel: 'File level error',
        }}
      />
    );

    expect(screen.getByText('File level error')).toBeInTheDocument();
  });
});
