import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ModernConfiguration from '@/components/configuration/ModernConfiguration';
import * as configHook from '@/components/configuration/hooks/useConfigurationForm';
import * as loggerHook from '@/hooks/use-logger-config';

jest.mock('@/components/configuration/hooks/useConfigurationForm', () => ({
  useConfigurationForm: jest.fn(),
}));

jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ModernConfiguration', () => {
  const mockHandleTabChange = jest.fn();
  const mockHandleInputChange = jest.fn();
  const mockHandleLlamaServerChange = jest.fn();
  const mockHandleSave = jest.fn();
  const mockHandleReset = jest.fn();
  const mockHandleSync = jest.fn();
  const mockApplyToLogger = jest.fn();

  const defaultConfig: Record<string, unknown> = {
    loading: false,
    activeTab: 0,
    formConfig: {
      basePath: '/models',
      logLevel: 'info',
      maxConcurrentModels: 5,
    },
    validationErrors: [],
    isSaving: false,
    saveSuccess: false,
    handleTabChange: mockHandleTabChange,
    handleInputChange: mockHandleInputChange,
    handleLlamaServerChange: mockHandleLlamaServerChange,
    handleSave: mockHandleSave,
    handleReset: mockHandleReset,
    handleSync: mockHandleSync,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue(defaultConfig);
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: { enableConsoleLogging: true },
      updateConfig: jest.fn(),
      applyToLogger: mockApplyToLogger,
      loading: false,
    });
  });

  it('renders loading state when loading is true', () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      loading: true,
    });
    renderWithTheme(<ModernConfiguration />);
    expect(screen.getByText('Loading Configuration...')).toBeInTheDocument();
  });

  it('renders configuration header', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Configuration Center')).toBeInTheDocument();
    });
  });

  it('renders configuration tabs', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const tabs = screen.getAllByText('General Settings');
      expect(tabs).toHaveLength(2);
      expect(screen.getByText('Llama-Server Settings')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByText('Logger Settings')).toBeInTheDocument();
    });
  });

  it('renders General Settings tab when activeTab is 0', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const headings = screen.getAllByText('General Settings');
      expect(headings).toHaveLength(2);
    });
  });

  it('renders Llama-Server Settings tab when activeTab is 1', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      activeTab: 1,
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const headings = screen.getAllByText('Llama-Server Settings');
      expect(headings).toHaveLength(2);
    });
  });

  it('renders Save Configuration button', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Save Configuration')).toBeInTheDocument();
    });
  });

  it('renders General Settings tab when activeTab is 0', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const elements = screen.getAllByText('General Settings');
      expect(elements).toHaveLength(2);
    });
  });

  it('renders Llama-Server Settings tab when activeTab is 1', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      activeTab: 1,
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const elements = screen.getAllByText('Llama-Server Settings');
      expect(elements).toHaveLength(2);
    });
  });

  it('renders Advanced Settings tab when activeTab is 2', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      activeTab: 2,
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    });
  });

  it('renders Logger Settings tab when activeTab is 3', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      activeTab: 3,
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Log Levels')).toBeInTheDocument();
    });
  });

  it('renders success message when saveSuccess is true', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      saveSuccess: true,
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });
  });

  it('renders validation errors when errors exist', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      validationErrors: ['Host is required'],
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Configuration Errors')).toBeInTheDocument();
      expect(screen.getByText('• Host is required')).toBeInTheDocument();
    });
  });

  it('disables Save button when isSaving is true', async () => {
    (configHook.useConfigurationForm as jest.Mock).mockReturnValue({
      ...defaultConfig,
      isSaving: true,
    });
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('enables Save button when isSaving is false', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  it('uses useConfigurationForm hook', () => {
    renderWithTheme(<ModernConfiguration />);
    expect(configHook.useConfigurationForm).toHaveBeenCalled();
  });

  it('renders without crashing', async () => {
    renderWithTheme(<ModernConfiguration />);
    await waitFor(() => {
      expect(screen.getByText('Configuration Center')).toBeInTheDocument();
    });
  });
});
