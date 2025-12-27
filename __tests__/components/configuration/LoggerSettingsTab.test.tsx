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
  useTheme: () => ({ isDark: false }),
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
    const checkbox = screen.getByRole('checkbox', { name: /enable console logging/i });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: false });
  });

  it('calls updateConfig when Console Level is changed', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling;
    fireEvent.change(select!, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: 'debug' });
  });

  it('calls updateConfig when File Logging switch is toggled', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const checkbox = screen.getByRole('checkbox', { name: /enable file logging/i });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  it('calls updateConfig when File Level is changed', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Level (application.log)').nextElementSibling;
    fireEvent.change(select!, { target: { value: 'debug' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: 'debug' });
  });

  it('calls updateConfig when Error Level is changed', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Error File Level (errors.log)').nextElementSibling;
    fireEvent.change(select!, { target: { value: 'warn' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: 'warn' });
  });

  it('calls updateConfig when Max File Size is changed', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Max File Size').nextElementSibling;
    fireEvent.change(select!, { target: { value: '50m' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: '50m' });
  });

  it('calls updateConfig when File Retention Period is changed', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Retention Period').nextElementSibling;
    fireEvent.change(select!, { target: { value: '60d' } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: '60d' });
  });

  it('disables Console Level when Console Logging is disabled', () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
    });
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling;
    expect(select).toBeDisabled();
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
    expect(fileSelect).toBeDisabled();
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

  it('renders all console level options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Console Level').nextElementSibling;
    fireEvent.mouseDown(select!);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  it('renders all max file size options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('Max File Size').nextElementSibling;
    fireEvent.mouseDown(select!);
    expect(screen.getByText('10 MB')).toBeInTheDocument();
    expect(screen.getByText('20 MB')).toBeInTheDocument();
    expect(screen.getByText('50 MB')).toBeInTheDocument();
    expect(screen.getByText('100 MB')).toBeInTheDocument();
    expect(screen.getByText('500 MB')).toBeInTheDocument();
  });

  it('renders all file retention period options', () => {
    renderWithTheme(<LoggerSettingsTab />);
    const select = screen.getByText('File Retention Period').nextElementSibling;
    fireEvent.mouseDown(select!);
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('14 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('60 Days')).toBeInTheDocument();
    expect(screen.getByText('90 Days')).toBeInTheDocument();
  });
});
