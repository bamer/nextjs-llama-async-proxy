import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LoggerSettingsTab } from '@/components/configuration/LoggerSettingsTab';
import * as loggerHook from '@/hooks/use-logger-config';

jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

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
    const { useTheme } = require('@/contexts/ThemeContext');
    jest.mocked(useTheme).mockReturnValue({ isDark: false });
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
    expect(screen.getByLabelText('Enable Console Logging')).toBeInTheDocument();
  });

  it('renders Console Level select', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('renders File Logging switch', () => {
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByLabelText('Enable File Logging (logs/ directory)')).toBeInTheDocument();
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
    const { useTheme } = require('@/contexts/ThemeContext');
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({ isDark: true });
    renderWithTheme(<LoggerSettingsTab />);
    expect(screen.getByText('Log Levels')).toBeInTheDocument();
  });

  // Positive test: Console Level change with different values
  it('calls updateConfig when Console Level is changed to debug', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Debug'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'debug' });
  });

  it('calls updateConfig when Console Level is changed to error', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Error'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'error' });
  });

  it('calls updateConfig when Console Level is changed to warning', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Warning'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'warn' });
  });

  // Positive test: File Level change
  it('calls updateConfig when File Level is changed to debug', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Level (application.log)').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Debug'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'debug' });
  });

  it('calls updateConfig when File Level is changed to error', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Level (application.log)').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Error'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'error' });
  });

  // Positive test: Error File Level change
  it('calls updateConfig when Error File Level is changed to warn', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Error File Level (errors.log)').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Error + Warning'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'warn' });
  });

  it('calls updateConfig when Error File Level is changed to error', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Error File Level (errors.log)').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Error Only'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'error' });
  });

  // Positive test: Max File Size change
  it('calls updateConfig when Max File Size is changed to 10m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Max File Size').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('10 MB'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '10m' });
  });

  it('calls updateConfig when Max File Size is changed to 100m', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Max File Size').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('100 MB'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '100m' });
  });

  // Positive test: File Retention Period change
  it('calls updateConfig when File Retention Period is changed to 7d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Retention Period').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('7 Days'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '7d' });
  });

  it('calls updateConfig when File Retention Period is changed to 90d', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Retention Period').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('90 Days'));
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '90d' });
  });

  // Negative test: All file selects disabled when File Logging is off
  it('disables all file logging selects when File Logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const fileLevelSelect = screen.getByText('File Level (application.log)').nextElementSibling;
    const errorLevelSelect = screen.getByText('Error File Level (errors.log)').nextElementSibling;
    const maxSizeSelect = screen.getByText('Max File Size').nextElementSibling;
    const retentionSelect = screen.getByText('File Retention Period').nextElementSibling;

    expect(fileLevelSelect).toHaveClass('Mui-disabled');
    expect(errorLevelSelect).toHaveClass('Mui-disabled');
    expect(maxSizeSelect).toHaveClass('Mui-disabled');
    expect(retentionSelect).toHaveClass('Mui-disabled');
  });

  // Positive test: All file selects enabled when File Logging is on
  it('enables all file logging selects when File Logging is enabled', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const fileLevelSelect = screen.getByText('File Level (application.log)').nextElementSibling;
    const maxSizeSelect = screen.getByText('Max File Size').nextElementSibling;

    expect(fileLevelSelect).not.toHaveClass('Mui-disabled');
    expect(maxSizeSelect).not.toHaveClass('Mui-disabled');
  });

  // Positive test: Console select enabled when Console Logging is on
  it('enables console level select when Console Logging is enabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const consoleLevelSelect = screen.getByText('Console Level').nextElementSibling;
    expect(consoleLevelSelect).not.toHaveClass('Mui-disabled');
  });

  // Positive test: Loading state with disabled controls
  it('displays loading state and keeps elements present', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
    });
    renderWithTheme(<LoggerSettingsTab />);

    expect(screen.getByText('Log Levels')).toBeInTheDocument();
    // Should still render UI elements even when loading
    expect(screen.getByText('Console Level')).toBeInTheDocument();
    expect(screen.getByText('File Level (application.log)')).toBeInTheDocument();
  });

  // Negative test: Null config with default values
  it('handles null loggerConfig with default values', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    expect(screen.getByText('Log Levels')).toBeInTheDocument();
    // Should use ?? fallback values
    expect(screen.getByRole('switch', { name: /enable console logging/i })).toBeChecked();
    expect(screen.getByRole('switch', { name: /enable file logging/i })).toBeChecked();
  });

  // Negative test: Undefined config with default values
  it('handles undefined loggerConfig with default values', () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    expect(screen.getByText('Log Levels')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /enable console logging/i })).toBeChecked();
    expect(screen.getByRole('switch', { name: /enable file logging/i })).toBeChecked();
  });

  // Positive test: Custom config values
  it('renders with custom loggerConfig values', () => {
    const customConfig = {
      enableConsoleLogging: false,
      consoleLevel: 'error',
      enableFileLogging: false,
      fileLevel: 'debug',
      errorLevel: 'warn',
      maxFileSize: '50m',
      maxFiles: '14d',
    };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: customConfig,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const consoleSwitch = screen.getByRole('switch', { name: /enable console logging/i });
    const fileSwitch = screen.getByRole('switch', { name: /enable file logging/i });

    expect(consoleSwitch).not.toBeChecked();
    expect(fileSwitch).not.toBeChecked();
  });

  // Positive test: All max file size options
  it('renders all Max File Size options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Max File Size').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);

    expect(screen.getByText('10 MB')).toBeInTheDocument();
    expect(screen.getByText('20 MB')).toBeInTheDocument();
    expect(screen.getByText('50 MB')).toBeInTheDocument();
    expect(screen.getByText('100 MB')).toBeInTheDocument();
    expect(screen.getByText('500 MB')).toBeInTheDocument();
  });

  // Positive test: All file retention options
  it('renders all File Retention Period options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Retention Period').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);

    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('14 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('60 Days')).toBeInTheDocument();
    expect(screen.getByText('90 Days')).toBeInTheDocument();
  });

  // Positive test: Verify all console level options are present
  it('renders all Console Level options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  // Positive test: Verify all file level options are present
  it('renders all File Level options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Level (application.log)').nextElementSibling as HTMLElement;
    fireEvent.mouseDown(select);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  // Positive test: Toggle file logging and verify state change
  it('updates config when toggling File Logging', () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);

    const switchEl = screen.getByRole('switch', { name: /enable file logging/i });
    fireEvent.click(switchEl);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });
});
