import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ConfigurationPage from '@/components/pages/ConfigurationPage';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock HTMLFormElement.prototype.requestSubmit which is not implemented in jsdom
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  value: jest.fn(),
});

describe('ConfigurationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Suppress console.error for expected test cases
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive Test: Renders correctly with default config
  it('renders correctly with default config', () => {
    // Act: Render component
    render(<ConfigurationPage />);

    // Assert: Component renders with expected elements
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    // Use getAllByText in case "General Settings" appears multiple times
    const generalSettings = screen.getAllByText('General Settings');
    expect(generalSettings.length).toBeGreaterThan(0);
  });

  it('renders tabs correctly', () => {
    render(<ConfigurationPage />);

    // Assert: Tab buttons should be visible (use getAllByText since text appears in tab and heading)
    expect(screen.getAllByText('General Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Model Default Parameters').length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<ConfigurationPage />);

    // Act: Click on model defaults tab (get the first one which is the button)
    const modelDefaultsTabs = screen.getAllByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTabs[0]);

    // Assert: Tab content should be visible (now there should be 2 - button and heading)
    expect(screen.getAllByText('Model Default Parameters').length).toBe(2);
  });

  it('updates input fields', () => {
    render(<ConfigurationPage />);

    // Act: Change basePath input
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.change(basePathInput, { target: { value: '/new/path' } });

    // Assert: Input value is updated
    expect(basePathInput).toHaveValue('/new/path');
  });

  it('updates log level', () => {
    render(<ConfigurationPage />);

    // Act: Change log level
    const logLevelInput = screen.getByDisplayValue('info');
    fireEvent.change(logLevelInput, { target: { value: 'debug' } });

    // Assert: Value is updated
    expect(logLevelInput).toHaveValue('debug');
  });

  it('updates max concurrent models', () => {
    render(<ConfigurationPage />);

    // Act: Change max concurrent models
    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '10' } });

    // Assert: Value is updated
    expect(maxModelsInput).toHaveValue(10);
  });

  // Positive Test: Toggles auto update checkbox
  it('toggles auto update checkbox', () => {
    render(<ConfigurationPage />);

    // Act: Find checkbox by index and toggle
    const checkboxes = screen.getAllByRole('checkbox');
    const autoUpdateCheckbox = checkboxes[0] as HTMLInputElement;
    expect(autoUpdateCheckbox.checked).toBe(true);

    fireEvent.click(autoUpdateCheckbox);

    // Assert: Checkbox state changes
    expect(autoUpdateCheckbox.checked).toBe(false);
  });

  // Positive Test: Toggles notifications checkbox
  it('toggles notifications enabled checkbox', () => {
    render(<ConfigurationPage />);

    // Act: Find second checkbox and toggle
    const checkboxes = screen.getAllByRole('checkbox');
    const notificationsCheckbox = checkboxes[1] as HTMLInputElement;
    expect(notificationsCheckbox.checked).toBe(true);

    fireEvent.click(notificationsCheckbox);

    // Assert: Checkbox state changes
    expect(notificationsCheckbox.checked).toBe(false);
  });

  it('saves configuration via API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Click save button
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: API is called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // Positive Test: Shows success message on successful save
  it('shows success message on successful save', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Save configuration
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Success message appears
    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });
  });

  // Negative Test: Handles API unavailable gracefully
  it('shows fallback message when API is unavailable', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Act: Save configuration
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Fallback message is shown
    await waitFor(() => {
      expect(screen.getByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  // Negative Test: Handles save failure
  it('shows error message on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    });

    // Act: Attempt save
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Error message displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  it('disables save button while saving', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    // Act: Start save operation
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Button disabled during save
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('displays saving text while saving', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    // Act: Start save
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Saving text shown
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('renders model defaults tab inputs', () => {
    render(<ConfigurationPage />);

    // Act: Switch to model defaults tab
    const modelDefaultsTabs = screen.getAllByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTabs[0]);

    // Assert: Model default inputs are visible
    expect(screen.getByDisplayValue('4096')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2048')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.9')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
  });

  it('updates model default parameters', () => {
    render(<ConfigurationPage />);

    // Act: Switch to model defaults tab
    const modelDefaultsTabs = screen.getAllByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTabs[0]);

    // Act: Change ctx_size input
    const ctxSizeInput = screen.getByDisplayValue('4096');
    fireEvent.change(ctxSizeInput, { target: { value: '8192' } });

    // Assert: Value is updated
    expect(ctxSizeInput).toHaveValue(8192);
  });

  it('handles partial configuration in form', () => {
    render(<ConfigurationPage />);

    // Act: Update only some fields
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.change(basePathInput, { target: { value: '/updated/path' } });

    // Assert: Partial update works
    expect(basePathInput).toHaveValue('/updated/path');
  });

  it('handles invalid JSON in API response gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    // Act: Attempt save
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Error message displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  it('handles null config value from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });

    // Act: Save configuration
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Still shows success or fallback message
    await waitFor(() => {
      expect(screen.queryByText('Configuration saved successfully!') ||
              screen.queryByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  it('handles empty object from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    // Act: Save configuration
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Still shows success or fallback message
    await waitFor(() => {
      expect(screen.queryByText('Configuration saved successfully!') ||
              screen.queryByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  it('re-enables save button after save completes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Save configuration
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Button re-enabled after save
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('handles rapid successive save attempts', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Multiple rapid save attempts
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');

    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    // Assert: All attempts eventually succeed
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
