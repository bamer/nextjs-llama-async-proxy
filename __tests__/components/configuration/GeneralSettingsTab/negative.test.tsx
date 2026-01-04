import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GeneralSettingsTab } from '@/components/configuration/GeneralSettingsTab';
import {
  renderWithTheme,
  defaultFormConfig,
  defaultFieldErrors,
  clearAllMocks,
  setupLightThemeMock,
  setupFramerMotionMock,
} from './test-utils';

jest.mock('@/contexts/ThemeContext');

setupFramerMotionMock();

describe('GeneralSettingsTab Negative Tests', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  it('handles empty formConfig', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={{}}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('displays helper text for inputs', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByText('Path to your models directory')).toBeInTheDocument();
    expect(screen.getByText('Logging verbosity level')).toBeInTheDocument();
  });

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
      <GeneralSettingsTab
        formConfig={undefinedConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('handles empty formConfig without crashing', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={{} as typeof defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('handles undefined autoUpdate value gracefully', () => {
    const config = {
      ...defaultFormConfig,
      autoUpdate: undefined as unknown as boolean,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );

    const checkbox = screen.getByLabelText('Auto Update');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles undefined notificationsEnabled value gracefully', () => {
    const config = {
      ...defaultFormConfig,
      notificationsEnabled: undefined as unknown as boolean,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );

    const checkbox = screen.getByLabelText('Notifications Enabled');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles field error for basePath', () => {
    const fieldErrors = {
      basePath: 'Base path is required',
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={fieldErrors}
      />,
    );

    expect(screen.getByText('Base path is required')).toBeInTheDocument();
    const basePathInput = screen.getByLabelText('Base Path');
    expect(basePathInput).toHaveClass('Mui-error');
  });

  it('handles field error for logLevel', () => {
    const fieldErrors = {
      logLevel: 'Invalid log level',
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={fieldErrors}
      />,
    );

    expect(screen.getByText('Invalid log level')).toBeInTheDocument();
    const logLevelSelect = screen.getByLabelText('Log Level');
    expect(logLevelSelect).toHaveClass('Mui-error');
  });

  it('handles field error for maxConcurrentModels', () => {
    const fieldErrors = {
      maxConcurrentModels: 'Must be between 1 and 20',
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={fieldErrors}
      />,
    );

    expect(screen.getByText('Must be between 1 and 20')).toBeInTheDocument();
    const maxConcurrentInput = screen.getByLabelText('Max Concurrent Models');
    expect(maxConcurrentInput).toHaveClass('Mui-error');
  });

  it('handles field error for llamaServerPath', () => {
    const fieldErrors = {
      llamaServerPath: 'Server path is required',
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={fieldErrors}
      />,
    );

    expect(screen.getByText('Server path is required')).toBeInTheDocument();
    const serverPathInput = screen.getByLabelText('Llama-Server Path');
    expect(serverPathInput).toHaveClass('Mui-error');
  });

  it('shows error helper text when field errors exist', () => {
    const fieldErrors = {
      basePath: 'Error message',
      logLevel: 'Invalid level',
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={fieldErrors}
      />,
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Invalid level')).toBeInTheDocument();
    expect(screen.queryByText('Path to your models directory')).not.toBeInTheDocument();
    expect(screen.queryByText('Logging verbosity level')).not.toBeInTheDocument();
  });

  it('does not render single model mode alert when maxConcurrentModels > 1', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    expect(screen.queryByText('Single Model Mode:')).not.toBeInTheDocument();
  });

  it('does not render single model mode alert when maxConcurrentModels is 0', () => {
    const zeroModelConfig = {
      ...defaultFormConfig,
      maxConcurrentModels: 0,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={zeroModelConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    expect(screen.queryByText('Single Model Mode:')).not.toBeInTheDocument();
  });
});
