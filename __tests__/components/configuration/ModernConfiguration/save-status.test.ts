import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getModernConfiguration,
  createDefaultHookValue,
  mockHandleSave,
} from './test-utils';

describe('ModernConfiguration - Save Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('renders save button', () => {
    render(getModernConfiguration());

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it('handles save action', async () => {
    render(getModernConfiguration());

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockHandleSave).toHaveBeenCalled();
    });
  });

  it('disables save button when isSaving is true', () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      isSaving: true,
    });

    render(getModernConfiguration());

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when isSaving is false', () => {
    render(getModernConfiguration());

    const saveButton = screen.getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });
});

describe('ModernConfiguration - Status Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows save success message', () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      saveSuccess: true,
    });

    render(getModernConfiguration());

    expect(screen.getByText('Save successful')).toBeInTheDocument();
  });

  it('shows validation errors message', () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      validationErrors: ['Error 1', 'Error 2'],
    });

    render(getModernConfiguration());

    expect(screen.getByText('Validation errors')).toBeInTheDocument();
  });

  it('does not show status messages when none are present', () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      saveSuccess: false,
      validationErrors: null,
    });

    render(getModernConfiguration());

    const statusMessages = screen.getByTestId('status-messages');
    expect(statusMessages.textContent).toBe('');
  });
});
