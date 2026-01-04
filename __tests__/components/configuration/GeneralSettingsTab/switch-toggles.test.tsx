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

describe('GeneralSettingsTab Switch Toggles', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  afterEach(() => {
    cleanup();
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
