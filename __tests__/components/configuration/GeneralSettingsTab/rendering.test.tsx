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
  setupDarkThemeMock,
  setupFramerMotionMock,
} from './test-utils';

jest.mock('@/contexts/ThemeContext');

setupFramerMotionMock();

describe('GeneralSettingsTab Rendering', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  it('renders correctly', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('renders Base Path input', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByLabelText('Base Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/models')).toBeInTheDocument();
  });

  it('renders Log Level select', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByLabelText('Log Level')).toBeInTheDocument();
  });

  it('renders Max Concurrent Models input', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByLabelText('Max Concurrent Models')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('renders Auto Update switch', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByLabelText('Auto Update')).toBeInTheDocument();
  });

  it('renders Notifications Enabled switch', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByLabelText('Notifications Enabled')).toBeInTheDocument();
  });

  it('renders Llama-Server Path input', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByLabelText('Llama-Server Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/path/to/llama-server')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    setupDarkThemeMock();
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('renders all log level options', () => {
    const { fireEvent } = require('@testing-library/react');
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    const select = screen.getByLabelText('Log Level');
    fireEvent.mouseDown(select);

    expect(screen.getByText('debug')).toBeInTheDocument();
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('warn')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('renders max concurrent models with constraints', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    const input = screen.getByLabelText('Max Concurrent Models');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '20');
  });

  it('displays all helper and description texts', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );
    expect(screen.getByText('Path to your models directory')).toBeInTheDocument();
    expect(screen.getByText('Logging verbosity level')).toBeInTheDocument();
    expect(screen.getByText('Maximum number of models that can run simultaneously')).toBeInTheDocument();
    expect(screen.getByText('Automatically update models and dependencies')).toBeInTheDocument();
    expect(screen.getByText('Receive system alerts and notifications')).toBeInTheDocument();
    expect(screen.getByText('Path to llama-server executable')).toBeInTheDocument();
  });

  it('renders Alert component with correct severity', () => {
    const singleModelConfig = {
      ...defaultFormConfig,
      maxConcurrentModels: 1,
    };
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: singleModelConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('shows default helper text when no field errors', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );

    expect(screen.getByText('Path to your models directory')).toBeInTheDocument();
    expect(screen.getByText('Logging verbosity level')).toBeInTheDocument();
  });

  it('has correct ARIA attributes for Max Concurrent Models input', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '20');
  });

  it('has correct role for Switch components', () => {
    renderWithTheme(
      React.createElement(
        GeneralSettingsTab,
        {
          formConfig: defaultFormConfig,
          onInputChange: mockOnInputChange,
          fieldErrors: defaultFieldErrors,
        },
        null,
      ),
    );

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });
});
