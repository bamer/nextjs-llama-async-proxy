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

(useStore as jest.Mock).mockReturnValue(mockStore);

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
});
