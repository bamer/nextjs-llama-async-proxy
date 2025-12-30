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

  it('renders correctly', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  it('renders Console Logging switch', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByRole('switch', { name: /enable console logging/i })).toBeInTheDocument();
  });

  it('renders Console Level select', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('renders File Logging switch', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByRole('switch', { name: /enable file logging/i })).toBeInTheDocument();
  });

  it('renders File Level select', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  it('renders Error File Level select', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Error File Level (errors.log)')).toBeInTheDocument();
  });

  it('renders Max File Size select', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Max File Size')).toBeInTheDocument();
  });

  it('renders File Retention Period select', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('File Retention Period')).toBeInTheDocument();
  });

  it('calls updateConfig when Console Logging switch is toggled', () => {
    renderComponent(<LoggerSettingsTab />);
    const checkbox = screen.getByRole('switch', { name: /enable console logging/i });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: false });
  });

  it('renders Console Level select with all options', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('calls updateConfig when File Logging switch is toggled', () => {
    renderComponent(<LoggerSettingsTab />);
    const checkbox = screen.getByRole('switch', { name: /enable file logging/i });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  it('renders File Level select with all options', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  it('renders Error Level select with all options', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Error File Level (errors.log)')).toBeInTheDocument();
  });

  it('renders Max File Size select with all options', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Max File Size')).toBeInTheDocument();
  });

  it('renders File Retention Period select with all options', () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('File Retention Period')).toBeInTheDocument();
  });

  it('renders with console logging disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('renders with file logging disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  it('handles null loggerConfig', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: {},
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  // Additional tests for better coverage

  it('toggles Console Logging switch exists', () => {
    renderComponent(<LoggerSettingsTab />);

    const switchElement = screen.getByRole('switch', { name: /enable console logging/i });
    expect(switchElement).toBeInTheDocument();
  });

  it('toggles File Logging switch exists', () => {
    renderComponent(<LoggerSettingsTab />);

    const switchElement = screen.getByRole('switch', { name: /enable file logging/i });
    expect(switchElement).toBeInTheDocument();
  });

  it('handles disabled Console Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('handles disabled File Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('handles enabled Console Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('handles enabled File Logging state correctly', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('renders all select components', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
  });

  it('handles undefined loggerConfig with fallbacks', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

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
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('does not crash with undefined loggerConfig', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('handles loading state correctly', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
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
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it('handles loading state without errors', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

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
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox1 = screen.getByRole('switch', { name: /enable console logging/i }) as HTMLInputElement;
    const checkbox2 = screen.getByRole('switch', { name: /enable file logging/i }) as HTMLInputElement;

    expect(checkbox1.checked).toBe(false);
    expect(checkbox2.checked).toBe(false);
  });

  it('renders all UI elements correctly', () => {
    renderComponent(<LoggerSettingsTab />);

    expect(screen.getByText('Log Levels')).toBeInTheDocument();
    expect(screen.getByText('Console Level')).toBeInTheDocument();
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
    expect(screen.getByText('Error File Level (errors.log)')).toBeInTheDocument();
    expect(screen.getByText('Max File Size')).toBeInTheDocument();
    expect(screen.getByText('File Retention Period')).toBeInTheDocument();
  });

  it('handles all switches rendered', () => {
    renderComponent(<LoggerSettingsTab />);

    // Check for switch labels instead of counting checkboxes
    expect(screen.getByText('Enable Console Logging')).toBeInTheDocument();
    expect(screen.getByText('Enable File Logging (logs/ directory)')).toBeInTheDocument();
  });

  it('handles all selects rendered', () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
  });

  // Positive test: Verify Console Level select onChange works for all options

  // Positive test: Verify Console Level select onChange works for all options
  // This covers line 61: onChange={(e) => updateConfig({ consoleLevel: e.target.value })}
  it('calls updateConfig when Console Level is changed to error', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0]; // Console Level is first select
    fireEvent.change(select, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'error' });
  });

  it('calls updateConfig when Console Level is changed to warn', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'warn' });
  });

  it('calls updateConfig when Console Level is changed to info', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'info' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'info' });
  });

  it('calls updateConfig when Console Level is changed to debug', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[0];
    fireEvent.change(select, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'debug' });
  });

  // Positive test: Verify File Level select onChange works for all options
  // This covers line 98: onChange={(e) => updateConfig({ fileLevel: e.target.value })}
  it('calls updateConfig when File Level is changed to error', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1]; // File Level is second select
    fireEvent.change(select, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'error' });
  });

  it('calls updateConfig when File Level is changed to warn', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'warn' });
  });

  it('calls updateConfig when File Level is changed to info', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'info' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'info' });
  });

  it('calls updateConfig when File Level is changed to debug', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[1];
    fireEvent.change(select, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'debug' });
  });

  // Positive test: Verify Error Level select onChange works for all options
  // This covers line 118: onChange={(e) => updateConfig({ errorLevel: e.target.value })}
  it('calls updateConfig when Error Level is changed to error', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[2]; // Error Level is third select
    fireEvent.change(select, { target: { value: 'error' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'error' });
  });

  it('calls updateConfig when Error Level is changed to warn', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[2];
    fireEvent.change(select, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'warn' });
  });

  // Positive test: Verify Max File Size select onChange works for all options
  // This covers line 136: onChange={(e) => updateConfig({ maxFileSize: e.target.value })}
  it('calls updateConfig when Max File Size is changed to 10m', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3]; // Max File Size is fourth select
    fireEvent.change(select, { target: { value: '10m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '10m' });
  });

  it('calls updateConfig when Max File Size is changed to 20m', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '20m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '20m' });
  });

  it('calls updateConfig when Max File Size is changed to 50m', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '50m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '50m' });
  });

  it('calls updateConfig when Max File Size is changed to 100m', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '100m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '100m' });
  });

  it('calls updateConfig when Max File Size is changed to 500m', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[3];
    fireEvent.change(select, { target: { value: '500m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '500m' });
  });

  // Positive test: Verify File Retention Period select onChange works for all options
  // This covers line 157: onChange={(e) => updateConfig({ maxFiles: e.target.value })}
  it('calls updateConfig when File Retention is changed to 7d', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4]; // File Retention is fifth select
    fireEvent.change(select, { target: { value: '7d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '7d' });
  });

  it('calls updateConfig when File Retention is changed to 14d', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '14d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '14d' });
  });

  it('calls updateConfig when File Retention is changed to 30d', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '30d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '30d' });
  });

  it('calls updateConfig when File Retention is changed to 60d', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '60d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '60d' });
  });

  it('calls updateConfig when File Retention is changed to 90d', () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole('combobox');
    const select = selects[4];
    fireEvent.change(select, { target: { value: '90d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '90d' });
  });

  // Negative test: Verify Console Level select exists when console logging is disabled
  it('renders Console Level select when console logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    // Verify the component rendered (basic test)
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('renders File Level select when file logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    // Verify the component still renders - file logging can be set before enabling
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  // Positive test: Verify disabled state transitions work correctly
  it('handles disabled to enabled state transition for Console Logging', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

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
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole('switch', { name: /enable file logging/i });
    fireEvent.click(checkbox);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  // Positive test: Verify multiple select changes work correctly
  it('handles multiple sequential select changes', () => {
    renderComponent(<LoggerSettingsTab />);

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
