import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { GeneralSettingsTab } from '@/components/configuration/GeneralSettingsTab';

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('GeneralSettingsTab', () => {
  const mockOnInputChange = jest.fn();
  const defaultFormConfig = {
    basePath: '/models',
    logLevel: 'info',
    maxConcurrentModels: 5,
    autoUpdate: true,
    notificationsEnabled: false,
    llamaServerPath: '/path/to/llama-server',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('renders Base Path input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByLabelText('Base Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/models')).toBeInTheDocument();
  });

  it('renders Log Level select', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByLabelText('Log Level')).toBeInTheDocument();
  });

  it('renders Max Concurrent Models input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByLabelText('Max Concurrent Models')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('renders Auto Update switch', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByLabelText('Auto Update')).toBeInTheDocument();
  });

  it('renders Notifications Enabled switch', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByLabelText('Notifications Enabled')).toBeInTheDocument();
  });

  it('renders Llama-Server Path input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByLabelText('Llama-Server Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/path/to/llama-server')).toBeInTheDocument();
  });

  it('calls onInputChange when Base Path is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    const input = screen.getByLabelText('Base Path');
    fireEvent.change(input, { target: { name: 'basePath', value: '/new/path' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Log Level is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    const select = screen.getByLabelText('Log Level');
    fireEvent.change(select, { target: { name: 'logLevel', value: 'debug' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Max Concurrent Models is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '10' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Auto Update switch is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    const checkbox = screen.getByRole('switch', { name: /auto update/i });
    fireEvent.click(checkbox);
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Notifications switch is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    const checkbox = screen.getByRole('switch', { name: /notifications enabled/i });
    fireEvent.click(checkbox);
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles empty formConfig', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={{}} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('displays helper text for inputs', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByText('Path to your models directory')).toBeInTheDocument();
    expect(screen.getByText('Logging verbosity level')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ isDark: true });
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });
});
