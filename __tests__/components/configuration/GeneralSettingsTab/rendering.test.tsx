import { screen, cleanup } from '@testing-library/react';
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
} from './test-utils';

jest.mock('@/contexts/ThemeContext');

jest.mock('framer-motion', () => ({
  m: {
    div: (props: unknown) => {
      const { children, ...rest } = props as { children?: React.ReactNode; [key: string]: unknown };
      return React.createElement('div', rest as Record<string, unknown>, children);
    },
  },
}));

describe('GeneralSettingsTab Rendering', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('renders Base Path input', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByLabelText('Base Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/models')).toBeInTheDocument();
  });

  it('renders Log Level select', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByLabelText('Log Level')).toBeInTheDocument();
  });

  it('renders Max Concurrent Models input', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByLabelText('Max Concurrent Models')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('renders Auto Update switch', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByLabelText('Auto Update')).toBeInTheDocument();
  });

  it('renders Notifications Enabled switch', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByLabelText('Notifications Enabled')).toBeInTheDocument();
  });

  it('renders Llama-Server Path input', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByLabelText('Llama-Server Path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/path/to/llama-server')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    setupDarkThemeMock();
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('renders max concurrent models with constraints', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const input = screen.getByLabelText('Max Concurrent Models');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '20');
  });

  it('renders Alert component with correct severity', () => {
    const singleModelConfig = {
      ...defaultFormConfig,
      maxConcurrentModels: 1,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={singleModelConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('has correct role for Switch components', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });
});
