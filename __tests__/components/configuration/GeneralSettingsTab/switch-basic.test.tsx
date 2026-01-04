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

describe('GeneralSettingsTab Switch Interactions', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  afterEach(() => {
    cleanup();
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
});
