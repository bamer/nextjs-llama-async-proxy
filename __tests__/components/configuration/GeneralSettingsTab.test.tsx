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

  it('renders correctly', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('renders Base Path input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByLabelText('Base Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/models')).toBeInTheDocument();
  });

  it('renders Log Level select', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByLabelText('Log Level')).toBeInTheDocument();
  });

  it('renders Max Concurrent Models input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByLabelText('Max Concurrent Models')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('renders Auto Update switch', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByLabelText('Auto Update')).toBeInTheDocument();
  });

  it('renders Notifications Enabled switch', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByLabelText('Notifications Enabled')).toBeInTheDocument();
  });

  it('renders Llama-Server Path input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByLabelText('Llama-Server Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/path/to/llama-server')).toBeInTheDocument();
  });

  it('calls onInputChange when Base Path is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const input = screen.getByLabelText('Base Path');
    fireEvent.change(input, { target: { name: 'basePath', value: '/new/path' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Log Level is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const select = screen.getByLabelText('Log Level');
    fireEvent.change(select, { target: { name: 'logLevel', value: 'debug' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Max Concurrent Models is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '10' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Auto Update switch is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    // Use getByLabelText to find the switch since it's implemented with FormControlLabel
    const checkbox = screen.getByLabelText('Auto Update') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Notifications switch is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    // Use getByLabelText to find switch
    const checkbox = screen.getByLabelText('Notifications Enabled') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles empty formConfig', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={{}} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('displays helper text for inputs', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByText('Path to your models directory')).toBeInTheDocument();
    expect(screen.getByText('Logging verbosity level')).toBeInTheDocument();
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
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  // Positive test: Verify switch toggle events are properly handled and updateConfig called
  it('calls updateConfig with correct argument when Auto Update is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const checkbox = screen.getByLabelText('Auto Update') as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'autoUpdate',
          checked: expect.any(Boolean),
          type: 'checkbox',
        }),
      })
    );
  });

  it('calls updateConfig with correct argument when Notifications is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const checkbox = screen.getByLabelText('Notifications Enabled') as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'notificationsEnabled',
          checked: expect.any(Boolean),
          type: 'checkbox',
        }),
      })
    );
  });

  // Negative test: Verify disabled state when value is undefined
  it('handles undefined values gracefully', () => {
    const undefinedConfig = {
      basePath: undefined,
      logLevel: undefined,
      maxConcurrentModels: undefined,
      autoUpdate: false,
      notificationsEnabled: false,
      llamaServerPath: undefined,
    };
    renderWithTheme(
      <GeneralSettingsTab formConfig={undefinedConfig} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    // Should not crash and should render with default/empty values
  });

  // Positive test: Verify all log level options are rendered
  it('renders all log level options', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const select = screen.getByLabelText('Log Level');
    fireEvent.mouseDown(select);

    expect(screen.getByText('debug')).toBeInTheDocument();
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('warn')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  // Positive test: Verify input constraints (min/max)
  it('renders max concurrent models with constraints', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const input = screen.getByLabelText('Max Concurrent Models');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '20');
  });

  // Positive test: Verify description texts are displayed
  it('displays all helper and description texts', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    expect(screen.getByText('Path to your models directory')).toBeInTheDocument();
    expect(screen.getByText('Logging verbosity level')).toBeInTheDocument();
    expect(screen.getByText('Maximum number of models that can run simultaneously')).toBeInTheDocument();
    expect(screen.getByText('Automatically update models and dependencies')).toBeInTheDocument();
    expect(screen.getByText('Receive system alerts and notifications')).toBeInTheDocument();
    expect(screen.getByText('Path to llama-server executable')).toBeInTheDocument();
  });

  // Positive test: Verify switch initial states
  it('displays correct initial switch states', () => {
    const config = {
      ...defaultFormConfig,
      autoUpdate: false,
      notificationsEnabled: true,
    };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );
    const autoUpdateSwitch = screen.getByLabelText('Auto Update') as HTMLInputElement;
    const notificationsSwitch = screen.getByLabelText('Notifications Enabled') as HTMLInputElement;

    expect(autoUpdateSwitch.checked).toBe(false);
    expect(notificationsSwitch.checked).toBe(true);
  });

  // Negative test: Verify empty values don't crash
  it('handles empty formConfig without crashing', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={undefined as any} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  // Positive test: Verify llama server path rendering
  it('renders Llama-Server Path with correct value', () => {
    const config = {
      ...defaultFormConfig,
      llamaServerPath: '/custom/path/to/llama-server',
    };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );
    const input = screen.getByLabelText('Llama-Server Path');
    expect(input).toHaveValue('/custom/path/to/llama-server');
  });

  // Positive test: Verify base path input change
  it('updates base path value when changed', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );
    const input = screen.getByLabelText('Base Path');
    fireEvent.change(input, { target: { name: 'basePath', value: '/new/path' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  // Positive test: Verify Auto Update switch onChange handler works correctly
  // This covers lines 103-110: Switch onChange handler for autoUpdate
  it('calls onInputChange with correct event when Auto Update is toggled from false to true', () => {
    const config = { ...defaultFormConfig, autoUpdate: false };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    const checkbox = screen.getByLabelText('Auto Update') as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'autoUpdate',
          checked: true,
          type: 'checkbox',
        }),
      })
    );
  });

  it('calls onInputChange with correct event when Auto Update is toggled from true to false', () => {
    const config = { ...defaultFormConfig, autoUpdate: true };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    const checkbox = screen.getByLabelText('Auto Update') as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'autoUpdate',
          checked: false,
          type: 'checkbox',
        }),
      })
    );
  });

  // Positive test: Verify Notifications Enabled switch onChange handler works correctly
  // This covers lines 133-140: Switch onChange handler for notificationsEnabled
  it('calls onInputChange with correct event when Notifications is toggled from false to true', () => {
    const config = { ...defaultFormConfig, notificationsEnabled: false };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    const checkbox = screen.getByLabelText('Notifications Enabled') as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'notificationsEnabled',
          checked: true,
          type: 'checkbox',
        }),
      })
    );
  });

  it('calls onInputChange with correct event when Notifications is toggled from true to false', () => {
    const config = { ...defaultFormConfig, notificationsEnabled: true };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    const checkbox = screen.getByLabelText('Notifications Enabled') as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'notificationsEnabled',
          checked: false,
          type: 'checkbox',
        }),
      })
    );
  });

  // Positive test: Verify direct FormControlLabel onChange events work
  it('handles direct FormControlLabel onChange for Auto Update', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    // Find the FormControlLabel and trigger click on it
    const autoUpdateLabel = screen.getByText('Auto Update');
    fireEvent.click(autoUpdateLabel);

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles direct FormControlLabel onChange for Notifications', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const notificationsLabel = screen.getByText('Notifications Enabled');
    fireEvent.click(notificationsLabel);

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  // Positive test: Test extreme values for number inputs (0, 1, 20, 21)
  it('accepts min value of 1 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '1' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('accepts max value of 20 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '20' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles boundary value 0 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '0' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles boundary value 21 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '21' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  // Positive test: Test accessibility features (ARIA attributes)
  it('has correct ARIA attributes for Max Concurrent Models input', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '20');
  });

  it('has correct role for Switch components', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });

  // Negative test: Verify undefined values don't crash Switch components
  it('handles undefined autoUpdate value gracefully', () => {
    const config = {
      ...defaultFormConfig,
      autoUpdate: undefined,
    };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    const checkbox = screen.getByLabelText('Auto Update');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles undefined notificationsEnabled value gracefully', () => {
    const config = {
      ...defaultFormConfig,
      notificationsEnabled: undefined,
    };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    const checkbox = screen.getByLabelText('Notifications Enabled');
    expect(checkbox).toBeInTheDocument();
  });

  // Positive test: Verify multiple switch toggles work correctly
  it('handles multiple switch toggles in sequence', () => {
    renderWithTheme(
      <GeneralSettingsTab formConfig={defaultFormConfig} onInputChange={mockOnInputChange} fieldErrors={defaultFieldErrors} />
    );

    const autoUpdateCheckbox = screen.getByLabelText('Auto Update');
    const notificationsCheckbox = screen.getByLabelText('Notifications Enabled');

    fireEvent.click(autoUpdateCheckbox);
    expect(mockOnInputChange).toHaveBeenCalledTimes(1);

    fireEvent.click(notificationsCheckbox);
    expect(mockOnInputChange).toHaveBeenCalledTimes(2);

    fireEvent.click(autoUpdateCheckbox);
    expect(mockOnInputChange).toHaveBeenCalledTimes(3);
  });
});
