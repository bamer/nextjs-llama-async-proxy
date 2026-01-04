import { screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { GeneralSettingsTab } from '@/components/configuration/GeneralSettingsTab';
import {
  renderWithTheme,
  defaultFormConfig,
  defaultFieldErrors,
  clearAllMocks,
  setupLightThemeMock,
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

describe('GeneralSettingsTab Form Handling', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  afterEach(() => {
    cleanup();
  });

  it('calls onInputChange when Base Path is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const input = screen.getByLabelText('Base Path');
    fireEvent.change(input, { target: { name: 'basePath', value: '/new/path' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Log Level is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const select = screen.getByLabelText('Log Level');
    fireEvent.change(select, { target: { name: 'logLevel', value: 'debug' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Max Concurrent Models is changed', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '10' } });
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('updates base path value when changed', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const input = screen.getByLabelText('Base Path');
    fireEvent.change(input, { target: { name: 'basePath', value: '/new/path' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('accepts min value of 1 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '1' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('accepts max value of 20 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '20' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles boundary value 0 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '0' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles boundary value 21 for Max Concurrent Models', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const input = screen.getByLabelText('Max Concurrent Models');
    fireEvent.change(input, { target: { name: 'maxConcurrentModels', value: '21' } });

    expect(mockOnInputChange).toHaveBeenCalled();
  });
});
