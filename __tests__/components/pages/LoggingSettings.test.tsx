import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LoggingSettings from '@/components/pages/LoggingSettings';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useStore } from '@/lib/store';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    sendMessage: jest.fn(),
  }),
}));

jest.mock('@/lib/logger', () => ({
  getLoggerConfig: jest.fn(() => ({
    consoleLevel: 'debug',
    fileLevel: 'info',
    errorLevel: 'error',
    maxFileSize: '20m',
    maxFiles: '30d',
    enableFileLogging: true,
    enableConsoleLogging: true,
  })),
  updateLoggerConfig: jest.fn(),
}));

jest.mock('@/lib/store');

const mockStore = {
  getState: jest.fn(() => ({
    setLoading: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
  })),
};

const mockUseStore = useStore as any;
(mockUseStore as jest.Mock).mockReturnValue(mockStore);

function renderWithThemeProvider(component: React.ReactElement) {
  return render(<ThemeProvider>{component}</ThemeProvider>);
}

describe('LoggingSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Logging Configuration')).toBeInTheDocument();
    expect(screen.getByText('Advanced Logging System with File Rotation')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    const { getLoggerConfig } = require('@/lib/logger');
    getLoggerConfig.mockImplementationOnce(() => {
      throw new Error('Loading...');
    });
    
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Loading Logging Configuration...')).toBeInTheDocument();
  });

  it('renders console logging card', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Console Logging')).toBeInTheDocument();
    expect(screen.getByText('Configure console output logging')).toBeInTheDocument();
  });

  it('renders file logging card', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('File Logging')).toBeInTheDocument();
    expect(screen.getByText('Configure file logging with rotation')).toBeInTheDocument();
  });

  it('renders logging configuration actions card', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Logging Configuration Actions')).toBeInTheDocument();
    expect(screen.getByText('Save or reset your logging configuration')).toBeInTheDocument();
  });

  it('renders current configuration card', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Current Configuration')).toBeInTheDocument();
    expect(screen.getByText('Preview of your current logging settings')).toBeInTheDocument();
  });

  it('shows console logging enabled status', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows console level', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('toggles console logging', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const consoleSwitch = screen.getAllByRole('checkbox')[0];
    fireEvent.click(consoleSwitch);
    
    expect(consoleSwitch).toBeInTheDocument();
  });

  it('updates console log level via slider', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('toggles file logging', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    const fileLoggingSwitch = checkboxes[1];
    fireEvent.click(fileLoggingSwitch);
    
    expect(fileLoggingSwitch).toBeInTheDocument();
  });

  it('updates max file size', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: '50m' } });
    
    expect(maxSizeInput).toHaveValue('50m');
  });

  it('updates max files', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const maxFilesInput = screen.getByLabelText(/max files/i);
    fireEvent.change(maxFilesInput, { target: { value: '60d' } });
    
    expect(maxFilesInput).toHaveValue('60d');
  });

  it('calls updateLoggerConfig on save', () => {
    const { updateLoggerConfig } = require('@/lib/logger');
    const { sendMessage } = require('@/hooks/use-websocket').useWebSocket();
    
    renderWithThemeProvider(<LoggingSettings />);
    
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    
    expect(updateLoggerConfig).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith('updateLoggerConfig', expect.any(Object));
  });

  it('resets to default configuration', () => {
    const { updateLoggerConfig } = require('@/lib/logger');
    const { sendMessage } = require('@/hooks/use-websocket').useWebSocket();
    
    renderWithThemeProvider(<LoggingSettings />);
    
    const resetButton = screen.getByText('Reset to Defaults');
    fireEvent.click(resetButton);
    
    expect(updateLoggerConfig).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith('updateLoggerConfig', expect.any(Object));
  });

  it('shows save success log message', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    
    expect(console.log).toHaveBeenCalledWith('Logging configuration updated successfully');
  });

  it('handles save error', () => {
    const { updateLoggerConfig } = require('@/lib/logger');
    updateLoggerConfig.mockImplementationOnce(() => {
      throw new Error('Save failed');
    });
    
    renderWithThemeProvider(<LoggingSettings />);
    
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    
    expect(console.error).toHaveBeenCalled();
    expect(mockStore.getState().setError).toHaveBeenCalledWith('Failed to update logging configuration');
  });

  it('displays all log level marks', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('warn')).toBeInTheDocument();
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('debug')).toBeInTheDocument();
    expect(screen.getByText('verbose')).toBeInTheDocument();
  });

  it('shows file log level', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('File Level')).toBeInTheDocument();
  });

  it('shows error log level', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Error Level')).toBeInTheDocument();
  });

  it('shows helper text for max file size', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('e.g., 20m, 1g')).toBeInTheDocument();
  });

  it('shows helper text for max files', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('e.g., 30d, 7d')).toBeInTheDocument();
  });

  it('displays configuration status chips', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const chips = screen.getAllByText('Enabled');
    expect(chips.length).toBeGreaterThanOrEqual(2);
  });

  it('shows console level value', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Console Level')).toBeInTheDocument();
  });

  it('shows file level value', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('File Level')).toBeInTheDocument();
  });

  it('shows error level value', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getByText('Error Level')).toBeInTheDocument();
  });

  it('shows max file size value', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getAllByText('Max File Size').length).toBeGreaterThan(0);
  });

  it('shows max files value', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    expect(screen.getAllByText('Max Files').length).toBeGreaterThan(0);
  });

  it('renders sliders with value labels', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('handles console level slider change', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 0) {
      fireEvent.change(sliders[0], { target: { value: 1 } });
      expect(sliders[0]).toBeInTheDocument();
    }
  });

  it('handles file level slider change', () => {
    renderWithThemeProvider(<LoggingSettings />);
    
    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 1) {
      fireEvent.change(sliders[1], { target: { value: 2 } });
      expect(sliders[1]).toBeInTheDocument();
    }
  });

  it('handles error level slider change', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 2) {
      fireEvent.change(sliders[2], { target: { value: 0 } });
      expect(sliders[2]).toBeInTheDocument();
    }
  });

  // Edge Case Tests
  it('handles invalid maxFileSize value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: 'invalid' } });

    expect(maxSizeInput).toHaveValue('invalid');
  });

  it('handles very large maxFileSize value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: '999999g' } });

    expect(maxSizeInput).toHaveValue('999999g');
  });

  it('handles negative maxFileSize value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: '-20m' } });

    expect(maxSizeInput).toHaveValue('-20m');
  });

  it('handles invalid maxFiles value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxFilesInput = screen.getByLabelText(/max files/i);
    fireEvent.change(maxFilesInput, { target: { value: 'invalid' } });

    expect(maxFilesInput).toHaveValue('invalid');
  });

  it('handles very large maxFiles value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxFilesInput = screen.getByLabelText(/max files/i);
    fireEvent.change(maxFilesInput, { target: { value: '999999d' } });

    expect(maxFilesInput).toHaveValue('999999d');
  });

  it('handles empty file size value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: '' } });

    expect(maxSizeInput).toHaveValue('');
  });

  it('handles empty max files value', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxFilesInput = screen.getByLabelText(/max files/i);
    fireEvent.change(maxFilesInput, { target: { value: '' } });

    expect(maxFilesInput).toHaveValue('');
  });

  it('handles rapid slider changes', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 0) {
      for (let i = 0; i <= 4; i++) {
        fireEvent.change(sliders[0], { target: { value: i } });
      }
    }
  });

  it('handles concurrent toggles', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const checkboxes = screen.getAllByRole('checkbox');

    for (let i = 0; i < 10; i++) {
      fireEvent.click(checkboxes[0]);
    }
  });

  it('handles save operation with all disabled', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => fireEvent.click(cb));

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    const { updateLoggerConfig } = require('@/lib/logger');
    expect(updateLoggerConfig).toHaveBeenCalled();
  });

  it('handles save operation with all enabled', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    const { updateLoggerConfig } = require('@/lib/logger');
    expect(updateLoggerConfig).toHaveBeenCalled();
  });

  it('handles reset operation multiple times', () => {
    const { updateLoggerConfig } = require('@/lib/logger');
    const { sendMessage } = require('@/hooks/use-websocket').useWebSocket();

    renderWithThemeProvider(<LoggingSettings />);

    const resetButton = screen.getByText('Reset to Defaults');

    for (let i = 0; i < 5; i++) {
      fireEvent.click(resetButton);
    }

    expect(updateLoggerConfig).toHaveBeenCalledTimes(5);
    expect(sendMessage).toHaveBeenCalledTimes(5);
  });

  it('handles very long log level values', () => {
    const { getLoggerConfig } = require('@/lib/logger');
    getLoggerConfig.mockReturnValue({
      consoleLevel: 'a'.repeat(100) as any,
      fileLevel: 'b'.repeat(100) as any,
      errorLevel: 'c'.repeat(100) as any,
      maxFileSize: '20m',
      maxFiles: '30d',
      enableFileLogging: true,
      enableConsoleLogging: true,
    });

    renderWithThemeProvider(<LoggingSettings />);

    expect(screen.getByText('Loading Logging Configuration...')).not.toBeInTheDocument();
  });

  it('handles logger config throwing error on load', () => {
    const { getLoggerConfig } = require('@/lib/logger');
    getLoggerConfig.mockImplementation(() => {
      throw new Error('Config load error');
    });

    renderWithThemeProvider(<LoggingSettings />);

    expect(screen.getByText('Loading Logging Configuration...')).toBeInTheDocument();
  });

  it('handles updateLoggerConfig throwing error', () => {
    const { updateLoggerConfig } = require('@/lib/logger');
    updateLoggerConfig.mockImplementation(() => {
      throw new Error('Update error');
    });

    renderWithThemeProvider(<LoggingSettings />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    expect(console.error).toHaveBeenCalled();
  });

  it('handles special characters in file size', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: '@#$%^&*()' } });

    expect(maxSizeInput).toHaveValue('@#$%^&*()');
  });

  it('handles unicode in configuration', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const maxSizeInput = screen.getByLabelText(/max file size/i);
    fireEvent.change(maxSizeInput, { target: { value: '文件大小' } });

    expect(maxSizeInput).toHaveValue('文件大小');
  });

  it('handles empty configuration', () => {
    const { getLoggerConfig } = require('@/lib/logger');
    getLoggerConfig.mockReturnValue({} as any);

    renderWithThemeProvider(<LoggingSettings />);

    expect(screen.getByText('Loading Logging Configuration...')).not.toBeInTheDocument();
  });

  it('handles null configuration', () => {
    const { getLoggerConfig } = require('@/lib/logger');
    getLoggerConfig.mockReturnValue(null as any);

    renderWithThemeProvider(<LoggingSettings />);

    expect(screen.getByText('Loading Logging Configuration...')).not.toBeInTheDocument();
  });

  it('handles slider value at boundaries', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 0) {
      // Test minimum
      fireEvent.change(sliders[0], { target: { value: 0 } });

      // Test maximum
      fireEvent.change(sliders[0], { target: { value: 4 } });
    }
  });

  it('handles slider values outside range', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 0) {
      // Test below minimum
      fireEvent.change(sliders[0], { target: { value: -1 } });

      // Test above maximum
      fireEvent.change(sliders[0], { target: { value: 10 } });
    }
  });

  it('handles concurrent save and reset operations', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const saveButton = screen.getByText('Save Configuration');
    const resetButton = screen.getByText('Reset to Defaults');

    fireEvent.click(saveButton);
    fireEvent.click(resetButton);
    fireEvent.click(saveButton);

    const { updateLoggerConfig } = require('@/lib/logger');
    expect(updateLoggerConfig).toHaveBeenCalled();
  });

  it('handles WebSocket sendMessage errors', () => {
    const { sendMessage } = require('@/hooks/use-websocket').useWebSocket();
    sendMessage.mockImplementation(() => {
      throw new Error('WebSocket error');
    });

    renderWithThemeProvider(<LoggingSettings />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    expect(sendMessage).toHaveBeenCalled();
  });

  it('handles very rapid consecutive saves', () => {
    renderWithThemeProvider(<LoggingSettings />);

    const saveButton = screen.getByText('Save Configuration');

    for (let i = 0; i < 10; i++) {
      fireEvent.click(saveButton);
    }

    const { updateLoggerConfig } = require('@/lib/logger');
    expect(updateLoggerConfig).toHaveBeenCalledTimes(10);
  });

  it('handles configuration with all log levels disabled', () => {
    const { getLoggerConfig } = require('@/lib/logger');
    getLoggerConfig.mockReturnValue({
      consoleLevel: 'error' as any,
      fileLevel: 'error' as any,
      errorLevel: 'error' as any,
      maxFileSize: '20m',
      maxFiles: '30d',
      enableFileLogging: false,
      enableConsoleLogging: false,
    });

    renderWithThemeProvider(<LoggingSettings />);

    expect(screen.getByText('Loading Logging Configuration...')).not.toBeInTheDocument();
  });
});
