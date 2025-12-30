import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { GeneralSettingsTab } from '@/components/configuration/GeneralSettingsTab';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('framer-motion', () => ({
  m: {
    div: (props: unknown) => {
      const { children } = props as { children?: React.ReactNode };
      return <div>{children}</div>;
    },
  },
}));

jest.mock('@/contexts/ThemeContext');

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('GeneralSettingsTab - Coverage Enhancements', () => {
  const mockOnInputChange = jest.fn();
  const defaultFormConfig = {
    basePath: '/models',
    logLevel: 'info',
    maxConcurrentModels: 5,
    autoUpdate: true,
    notificationsEnabled: false,
    llamaServerPath: '/path/to/llama-server',
  };
  const defaultFieldErrors: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useTheme).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
  });

  // Render with maxConcurrentModels === 1
  it('renders Alert component when maxConcurrentModels is 1', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByText('Single Model Mode')).toBeInTheDocument();
    expect(screen.getByText(/Only one model can be loaded at a time/)).toBeInTheDocument();
  });

  // Verify Alert component renders
  it('displays Alert with info severity', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  // Verify Alert content
  it('displays correct Alert message content', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByText('Single Model Mode')).toBeInTheDocument();
    expect(screen.getByText('Loading a new model will require stopping currently running one first')).toBeInTheDocument();
    expect(screen.getByText('Change "Max Concurrent Models" to a higher value for parallel loading')).toBeInTheDocument();
  });

  // Test conditional helper text changes
  it('shows single model helper text when maxConcurrentModels is 1', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByText('Single model mode: Only one model loaded at a time')).toBeInTheDocument();
  });

  it('shows parallel mode helper text when maxConcurrentModels > 1', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 5 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByText('Parallel mode: Multiple models can be loaded simultaneously')).toBeInTheDocument();
  });

  it('does not show Alert when maxConcurrentModels > 1', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 5 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.queryByText('Single Model Mode')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Test Alert disappears when value changes
  it('hides Alert when maxConcurrentModels changes from 1 to > 1', () => {
    const { rerender } = renderWithTheme(
      <GeneralSettingsTab
        formConfig={{ ...defaultFormConfig, maxConcurrentModels: 1 }}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <GeneralSettingsTab
        formConfig={{ ...defaultFormConfig, maxConcurrentModels: 3 }}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Test field errors display
  it('displays field errors for basePath', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{ basePath: 'Invalid path' }}
      />
    );

    expect(screen.getByText('Invalid path')).toBeInTheDocument();
  });

  it('displays field errors for logLevel', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{ logLevel: 'Invalid log level' }}
      />
    );

    expect(screen.getByText('Invalid log level')).toBeInTheDocument();
  });

  it('displays field errors for maxConcurrentModels', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{ maxConcurrentModels: 'Invalid value' }}
      />
    );

    expect(screen.getByText('Invalid value')).toBeInTheDocument();
  });

  it('displays field errors for llamaServerPath', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{ llamaServerPath: 'Server path required' }}
      />
    );

    expect(screen.getByText('Server path required')).toBeInTheDocument();
  });

  // Test multiple field errors
  it('displays multiple field errors simultaneously', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{
          basePath: 'Invalid path',
          logLevel: 'Invalid log level',
          maxConcurrentModels: 'Invalid value',
          llamaServerPath: 'Server path required',
        }}
      />
    );

    expect(screen.getByText('Invalid path')).toBeInTheDocument();
    expect(screen.getByText('Invalid log level')).toBeInTheDocument();
    expect(screen.getByText('Invalid value')).toBeInTheDocument();
    expect(screen.getByText('Server path required')).toBeInTheDocument();
  });

  // Test error color styling
  it('applies error styling to fields with errors', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{ basePath: 'Invalid path' }}
      />
    );

    const basePathInput = screen.getByLabelText('Base Path');
    expect(basePathInput).toHaveClass('Mui-error');
  });

  // Test helper text conditionality with field errors
  it('shows field error instead of helper text when error exists', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{ basePath: 'Invalid path' }}
      />
    );

    const basePathInput = screen.getByLabelText('Base Path');
    expect(basePathInput).toHaveAttribute('helperText');
    expect(screen.getByText('Invalid path')).toBeInTheDocument();
    expect(screen.queryByText('Path to your models directory')).not.toBeInTheDocument();
  });

  // Test maxConcurrentModels boundary values
  it('renders with maxConcurrentModels set to minimum boundary (1)', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText('Single Model Mode')).toBeInTheDocument();
  });

  it('renders with maxConcurrentModels set to maximum boundary (20)', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 20 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.queryByText('Single Model Mode')).not.toBeInTheDocument();
  });

  // Test switch label text rendering
  it('renders Auto Update switch label and description', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByLabelText('Auto Update')).toBeInTheDocument();
    expect(screen.getByText('Automatically update models and dependencies')).toBeInTheDocument();
  });

  it('renders Notifications Enabled switch label and description', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByLabelText('Notifications Enabled')).toBeInTheDocument();
    expect(screen.getByText('Receive system alerts and notifications')).toBeInTheDocument();
  });

  // Test dark mode with Alert
  it('renders Alert in dark theme when maxConcurrentModels is 1', () => {
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
