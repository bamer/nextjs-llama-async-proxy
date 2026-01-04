import { screen } from '@testing-library/react';
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
  setupFramerMotionMock,
} from './test-utils';

jest.mock('@/contexts/ThemeContext');

setupFramerMotionMock();

describe('GeneralSettingsTab Form Handling', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
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

  it('calls onInputChange when Auto Update switch is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const checkbox = screen.getByLabelText('Auto Update') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onInputChange when Notifications switch is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );
    const checkbox = screen.getByLabelText('Notifications Enabled') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls updateConfig with correct argument when Auto Update is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
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
      }),
    );
  });

  it('calls updateConfig with correct argument when Notifications is toggled', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
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
      }),
    );
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

  it('calls onInputChange with correct event when Auto Update is toggled from false to true', () => {
    const config = { ...defaultFormConfig, autoUpdate: false };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
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
      }),
    );
  });

  it('calls onInputChange with correct event when Auto Update is toggled from true to false', () => {
    const config = { ...defaultFormConfig, autoUpdate: true };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
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
      }),
    );
  });

  it('calls onInputChange with correct event when Notifications is toggled from false to true', () => {
    const config = { ...defaultFormConfig, notificationsEnabled: false };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
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
      }),
    );
  });

  it('calls onInputChange with correct event when Notifications is toggled from true to false', () => {
    const config = { ...defaultFormConfig, notificationsEnabled: true };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
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
      }),
    );
  });

  it('handles direct FormControlLabel onChange for Auto Update', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const autoUpdateLabel = screen.getByText('Auto Update');
    fireEvent.click(autoUpdateLabel);

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('handles direct FormControlLabel onChange for Notifications', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const notificationsLabel = screen.getByText('Notifications Enabled');
    fireEvent.click(notificationsLabel);

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

  it('handles multiple switch toggles in sequence', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
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
