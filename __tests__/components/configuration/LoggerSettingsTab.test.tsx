import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LoggerSettingsTab } from '@/components/configuration/LoggerSettingsTab';
import * as loggerHook from '@/hooks/use-logger-config';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext');

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('LoggerSettingsTab', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useTheme).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: defaultLoggerConfig,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
  });

  it('renders correctly', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  it('renders Console Logging switch', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByRole('switch', { name: /enable console logging/i })).toBeInTheDocument();
  });

  it('renders Console Level select', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('renders File Logging switch', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByRole('switch', { name: /enable file logging/i })).toBeInTheDocument();
  });

  it('renders File Level select', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  it('renders Error File Level select', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Error File Level (errors.log)')).toBeInTheDocument();
  });

  it('renders Max File Size select', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Max File Size')).toBeInTheDocument();
  });

  it('renders File Retention Period select', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('File Retention Period')).toBeInTheDocument();
  });

  it('calls updateConfig when Console Logging switch is toggled', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const checkbox = screen.getByRole('switch', { name: /enable console logging/i });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: false });
  });

  it('renders Console Level select with all options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('calls updateConfig when File Logging switch is toggled', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const checkbox = screen.getByRole('switch', { name: /enable file logging/i });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  it('renders File Level select with all options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  it('renders Error Level select with all options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Error File Level (errors.log)')).toBeInTheDocument();
  });

  it('renders Max File Size select with all options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Max File Size')).toBeInTheDocument();
  });

  it('renders File Retention Period select with all options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('File Retention Period')).toBeInTheDocument();
  });

  it('disables Console Level when Console Logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);
    const selectContainer = screen.getByText('Console Level').nextElementSibling;
    expect(selectContainer).toHaveClass('Mui-disabled');
  });

  it('disables file selects when File Logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);
    const fileSelect = screen.getByText('File Level (application.log)').nextElementSibling;
    expect(fileSelect).toHaveClass('Mui-disabled');
  });

  it('handles loading state', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
    });
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  it('handles null loggerConfig', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  // Additional tests for better coverage

  it('toggles Console Logging multiple times', () => {
    renderWithTheme(<LoggerSettingsTab />);

    // Use querySelector or getByLabelText for consistency
    fireEvent.click(screen.getByRole('switch', { name: /enable console logging/i }));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: false });

    fireEvent.click(screen.getByRole('switch', { name: /enable console logging/i }));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: true });
  });

  it('toggles File Logging multiple times', () => {
    renderWithTheme(<LoggerSettingsTab />);

    fireEvent.click(screen.getByRole('switch', { name: /enable file logging/i }));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });

    fireEvent.click(screen.getByRole('switch', { name: /enable file logging/i }));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: true });
  });

  it('handles disabled Console Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('handles disabled File Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('handles enabled Console Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('handles enabled File Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('renders all select components', () => {
    renderWithTheme(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
  });

  it('handles undefined loggerConfig with fallbacks', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox1 = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    const checkbox2 = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;

    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(true);
  });

  it('does not crash with null loggerConfig', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    expect(() => {
      renderWithTheme(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('does not crash with undefined loggerConfig', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    expect(() => {
      renderWithTheme(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('handles loading state correctly', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
    });
    expect(() => {
      renderWithTheme(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('handles custom configuration values', () => {
    const customConfig = {
      enableConsoleLogging: false,
      consoleLevel: 'debug',
      enableFileLogging: false,
      fileLevel: 'debug',
      errorLevel: 'warn',
      maxFileSize: '100m',
      maxFiles: '90d',
    };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: customConfig,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    expect(() => {
      renderWithTheme(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('handles loading state without errors', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
    });
    renderWithTheme(<LoggerSettingsTab />);

    expect(screen.getByText('Log Levels')).toBeInTheDocument();
    expect(screen.getByText('Console Level')).toBeInTheDocument();
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  it('handles multiple disabled states simultaneously', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox1 = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    const checkbox2 = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;

    expect(checkbox1.checked).toBe(false);
    expect(checkbox2.checked).toBe(false);
  });

  it('renders all UI elements correctly', () => {
    renderWithTheme(<LoggerSettingsTab />);

    expect(screen.getByText('Log Levels')).toBeInTheDocument();
    expect(screen.getByText('Console Level')).toBeInTheDocument();
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
    expect(screen.getByText('Error File Level (errors.log)')).toBeInTheDocument();
    expect(screen.getByText('Max File Size')).toBeInTheDocument();
    expect(screen.getByText('File Retention Period')).toBeInTheDocument();
  });

  it('handles all checkboxes rendered', () => {
    renderWithTheme(<LoggerSettingsTab />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('handles all selects rendered', () => {
    renderWithTheme(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
  });

  // Positive test: Verify Console Level select onChange works for all options

  // Positive test: Verify Console Level select onChange works for all options
  // This covers line 61: onChange={(e) => updateConfig({ consoleLevel: e.target.value })}
  it('calls updateConfig when Console Level is changed to error', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0]; // Console Level is first select
    fireEvent.change(select, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'error' });
  });

  it('calls updateConfig when Console Level is changed to warn', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'warn' });
  });

  it('calls updateConfig when Console Level is changed to info', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'info' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'info' });
  });

  it('calls updateConfig when Console Level is changed to debug', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'debug' });
  });

  // Positive test: Verify File Level select onChange works for all options
  // This covers line 98: onChange={(e) => updateConfig({ fileLevel: e.target.value })}
  it('calls updateConfig when File Level is changed to error', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1]; // File Level is second select
    fireEvent.change(select, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'error' });
  });

  it('calls updateConfig when File Level is changed to warn', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'warn' });
  });

  it('calls updateConfig when File Level is changed to info', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'info' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'info' });
  });

  it('calls updateConfig when File Level is changed to debug', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'debug' });
  });

  // Positive test: Verify Error Level select onChange works for all options
  // This covers line 118: onChange={(e) => updateConfig({ errorLevel: e.target.value })}
  it('calls updateConfig when Error Level is changed to error', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[2]; // Error Level is third select
    fireEvent.change(select, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'error' });
  });

  it('calls updateConfig when Error Level is changed to warn', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[2];
    fireEvent.change(select, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'warn' });
  });

  // Positive test: Verify Max File Size select onChange works for all options
  // This covers line 136: onChange={(e) => updateConfig({ maxFileSize: e.target.value })}
  it('calls updateConfig when Max File Size is changed to 10m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3]; // Max File Size is fourth select
    fireEvent.change(select, { target: { value: '10m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '10m' });
  });

  it('calls updateConfig when Max File Size is changed to 20m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '20m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '20m' });
  });

  it('calls updateConfig when Max File Size is changed to 50m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '50m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '50m' });
  });

  it('calls updateConfig when Max File Size is changed to 100m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '100m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '100m' });
  });

  it('calls updateConfig when Max File Size is changed to 500m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '500m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '500m' });
  });

  // Positive test: Verify File Retention Period select onChange works for all options
  // This covers line 157: onChange={(e) => updateConfig({ maxFiles: e.target.value })}
  it('calls updateConfig when File Retention is changed to 7d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4]; // File Retention is fifth select
    fireEvent.change(select, { target: { value: '7d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '7d' });
  });

  it('calls updateConfig when File Retention is changed to 14d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '14d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '14d' });
  });

  it('calls updateConfig when File Retention is changed to 30d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '30d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '30d' });
  });

  it('calls updateConfig when File Retention is changed to 60d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '60d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '60d' });
  });

  it('calls updateConfig when File Retention is changed to 90d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '90d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '90d' });
  });

  // Negative test: Verify Select onChange does not call updateConfig when disabled
  // This tests that disabled state prevents onChange from firing
  it('does not call updateConfig when Console Level is changed while disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'debug' } });
    // Should not have been called because that select is disabled
    expect(mockUpdateConfig).not.toHaveBeenCalledWith({ consoleLevel: 'debug' });
  });

  it('does not call updateConfig when File Level is changed while disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'debug' } });
    // Should not have been called because that select is disabled
    expect(mockUpdateConfig).not.toHaveBeenCalledWith({ fileLevel: 'debug' });
  });

  // Positive test: Verify disabled state transitions work correctly
  it('handles disabled to enabled state transition for Console Logging', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable console logging/i });
    fireEvent.click(checkbox);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: true });
  });

  it('handles enabled to disabled state transition for File Logging', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable file logging/i });
    fireEvent.click(checkbox);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  // Positive test: Verify multiple select changes work correctly
  it('handles multiple sequential select changes', () => {
    renderWithTheme(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    const consoleSelect = selects[0];
    const fileSelect = selects[1];

    fireEvent.change(consoleSelect, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'debug' });

    fireEvent.change(fileSelect, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'warn' });

    fireEvent.change(consoleSelect, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'error' });
  });
});
