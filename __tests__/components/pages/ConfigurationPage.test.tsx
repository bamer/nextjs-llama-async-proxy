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
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    global.fetch = jest.fn();
    // Suppress console.error for expected test cases
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive Test: Renders correctly with default config
  it('renders correctly with default config', () => {
    // Arrange: Mock localStorage to return null (no saved config)
    mockLocalStorage.getItem.mockReturnValue(null);

    // Act: Render the component
    render(<ConfigurationPage />);

    // Assert: Component renders with expected elements
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    // Use getAllByText in case "General Settings" appears multiple times
    const generalSettings = screen.getAllByText('General Settings');
    expect(generalSettings.length).toBeGreaterThan(0);
  });

  // Positive Test: Loads config from localStorage on mount
  it('loads config from localStorage on mount', () => {
    // Arrange: Mock saved config in localStorage
    const savedConfig = JSON.stringify({
      basePath: '/custom/path',
      logLevel: 'debug',
      maxConcurrentModels: 3,
      autoUpdate: false,
      notificationsEnabled: false,
      modelDefaults: {
        ctx_size: 2048,
        batch_size: 1024,
        temperature: 0.7,
        top_p: 0.8,
        top_k: 30,
        gpu_layers: -1,
        threads: -1
      }
    });
    mockLocalStorage.getItem.mockReturnValue(savedConfig);

    // Act: Render component
    render(<ConfigurationPage />);

    // Assert: Config values are loaded and displayed
    expect(screen.getByDisplayValue('/custom/path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('debug')).toBeInTheDocument();
  });

  // Negative Test: Handles malformed localStorage config gracefully
  it('handles malformed localStorage config gracefully', () => {
    // Arrange: Mock invalid JSON in localStorage
    mockLocalStorage.getItem.mockReturnValue('invalid json');

    // Act: Render component
    render(<ConfigurationPage />);

    // Assert: Component still renders (doesn't crash), error is logged
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it('renders tabs correctly', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Assert: Tab buttons should be visible
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Model Default Parameters')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Click on model defaults tab
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    // Assert: Tab content should be visible
    expect(screen.getByText('Model Default Parameters')).toBeInTheDocument();
  });

  it('updates input fields', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change basePath input
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.change(basePathInput, { target: { value: '/new/path' } });

    // Assert: Input value is updated
    expect(basePathInput).toHaveValue('/new/path');
  });

  it('updates log level', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change log level
    const logLevelInput = screen.getByDisplayValue('info');
    fireEvent.change(logLevelInput, { target: { value: 'debug' } });

    // Assert: Value is updated
    expect(logLevelInput).toHaveValue('debug');
  });

  it('updates max concurrent models', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change max concurrent models
    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '10' } });

    // Assert: Value is updated
    expect(maxModelsInput).toHaveValue(10);
  });

  // Positive Test: Toggles auto update checkbox
  it('toggles auto update checkbox', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
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
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Find second checkbox and toggle
    const checkboxes = screen.getAllByRole('checkbox');
    const notificationsCheckbox = checkboxes[1] as HTMLInputElement;
    expect(notificationsCheckbox.checked).toBe(true);

    fireEvent.click(notificationsCheckbox);

    // Assert: Checkbox state changes
    expect(notificationsCheckbox.checked).toBe(false);
  });

  it('saves configuration to localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Click save button
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: localStorage.setItem is called
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  // Positive Test: Shows success message on successful save
  it('shows success message on successful save', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
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
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Act: Save configuration
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Fallback message is shown
    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    });
  });

  // Negative Test: Handles save failure
  it('shows error message on save failure', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
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
    mockLocalStorage.getItem.mockReturnValue(null);
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
    mockLocalStorage.getItem.mockReturnValue(null);
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
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Switch to model defaults tab
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    // Assert: Model default inputs are visible
    expect(screen.getByDisplayValue('4096')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2048')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.9')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
  });

  it('updates context size', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change context size
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const ctxSizeInput = screen.getByDisplayValue('4096');
    fireEvent.change(ctxSizeInput, { target: { value: '8192' } });

    // Assert: Value updated
    expect(ctxSizeInput).toHaveValue(8192);
  });

  it('updates temperature', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change temperature
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const tempInput = screen.getByDisplayValue('0.8');
    fireEvent.change(tempInput, { target: { value: '0.5' } });

    // Assert: Value updated
    expect(tempInput).toHaveValue(0.5);
  });

  it('updates top p', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change top p
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const topPInput = screen.getByDisplayValue('0.9');
    fireEvent.change(topPInput, { target: { value: '0.7' } });

    // Assert: Value updated
    expect(topPInput).toHaveValue(0.7);
  });

  it('updates top k', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change top k
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const topKInput = screen.getByDisplayValue('40');
    fireEvent.change(topKInput, { target: { value: '50' } });

    // Assert: Value updated
    expect(topKInput).toHaveValue(50);
  });

  it('updates gpu layers', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change gpu layers
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const gpuLayersInput = screen.getByDisplayValue('-1');
    fireEvent.change(gpuLayersInput, { target: { value: '35' } });

    // Assert: Value updated
    expect(gpuLayersInput).toHaveValue(35);
  });

  it('updates cpu threads', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Change cpu threads
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const threadsInput = screen.getByDisplayValue('-1');
    fireEvent.change(threadsInput, { target: { value: '8' } });

    // Assert: Value updated
    expect(threadsInput).toHaveValue(8);
  });

  it('saves model defaults configuration', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Save from model defaults tab
    render(<ConfigurationPage />);
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const saveButton = screen.getByText('Save Model Defaults');
    fireEvent.click(saveButton);

    // Assert: Save triggered
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  it('clears save message after 3 seconds', async () => {
    jest.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Save and advance timer
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });

    // Act: Advance timers
    jest.advanceTimersByTime(3000);

    // Assert: Message cleared
    await waitFor(() => {
      expect(screen.queryByText('Configuration saved successfully!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  // Edge Case Tests
  it('handles very long configuration values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Set very long path
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    const longPath = '/'.repeat(5000);
    fireEvent.change(basePathInput, { target: { value: longPath } });

    // Assert: Long value accepted
    expect(basePathInput).toHaveValue(longPath);
  });

  it('handles empty configuration values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Clear path
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.change(basePathInput, { target: { value: '' } });

    // Assert: Empty value accepted
    expect(basePathInput).toHaveValue('');
  });

  it('handles negative maxConcurrentModels value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Set negative value
    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '-10' } });

    // Assert: Negative value accepted (no validation in component)
    expect(maxModelsInput).toHaveValue(-10);
  });

  it('handles very large maxConcurrentModels value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Set very large value
    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '999999999' } });

    // Assert: Large value accepted
    expect(maxModelsInput).toHaveValue(999999999);
  });

  it('handles temperature at boundary values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Set boundary values
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const tempInput = screen.getByDisplayValue('0.8');
    fireEvent.change(tempInput, { target: { value: '0' } });
    expect(tempInput).toHaveValue(0);

    fireEvent.change(tempInput, { target: { value: '2' } });
    expect(tempInput).toHaveValue(2);
  });

  it('handles temperature values outside bounds', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Set out of bounds values
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const tempInput = screen.getByDisplayValue('0.8');
    fireEvent.change(tempInput, { target: { value: '-1' } });
    expect(tempInput).toHaveValue(-1);

    fireEvent.change(tempInput, { target: { value: '10' } });
    expect(tempInput).toHaveValue(10);
  });

  it('handles top_p at boundary values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Test boundary values
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const topPInput = screen.getByDisplayValue('0.9');
    fireEvent.change(topPInput, { target: { value: '0' } });
    expect(topPInput).toHaveValue(0);

    fireEvent.change(topPInput, { target: { value: '1' } });
    expect(topPInput).toHaveValue(1);
  });

  it('handles context size at extreme values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Test extreme values
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const ctxSizeInput = screen.getByDisplayValue('4096');
    fireEvent.change(ctxSizeInput, { target: { value: '0' } });
    expect(ctxSizeInput).toHaveValue(0);

    fireEvent.change(ctxSizeInput, { target: { value: '2000000' } });
    expect(ctxSizeInput).toHaveValue(2000000);
  });

  it('handles gpu_layers with negative values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Test negative gpu layers
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    const gpuLayersInput = screen.getByDisplayValue('-1');
    fireEvent.change(gpuLayersInput, { target: { value: '-100' } });
    expect(gpuLayersInput).toHaveValue(-100);
  });

  it('handles rapid tab switching', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Rapidly switch tabs
    const generalTab = screen.getByText('General Settings');
    const modelDefaultsTab = screen.getByText('Model Default Parameters');

    for (let i = 0; i < 10; i++) {
      fireEvent.click(generalTab);
      fireEvent.click(modelDefaultsTab);
    }

    // Assert: Component still functional
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Model Default Parameters')).toBeInTheDocument();
  });

  it('handles concurrent save attempts', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Double click save button
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    // Assert: Button disabled on second click
    expect(saveButton).toBeDisabled();
  });

  it('handles localStorage quota exceeded error', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      (error as any).name = 'QuotaExceededError';
      throw error;
    });

    // Act: Attempt save
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Fallback message shown
    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    });
  });

  it('handles API timeout', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    // Act: Save with timeout
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Timeout handled
    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles partial configuration in localStorage', () => {
    // Arrange: Partial config (missing some fields)
    const partialConfig = JSON.stringify({
      basePath: '/partial/path',
      // Missing other fields
    });
    mockLocalStorage.getItem.mockReturnValue(partialConfig);

    // Act: Render
    render(<ConfigurationPage />);

    // Assert: Partial data loaded, defaults used for missing fields
    expect(screen.getByDisplayValue('/partial/path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('info')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('handles invalid JSON in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('{ invalid json }');

    // Act: Render with invalid JSON
    render(<ConfigurationPage />);

    // Assert: Error logged, defaults used
    expect(console.error).toHaveBeenCalled();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('handles very large configuration object', () => {
    const largeConfig = JSON.stringify({
      basePath: '/'.repeat(10000),
      logLevel: 'debug',
      maxConcurrentModels: 999999,
      autoUpdate: false,
      notificationsEnabled: false,
      modelDefaults: {
        ctx_size: 999999999,
        batch_size: 999999999,
        temperature: 1.999,
        top_p: 0.999,
        top_k: 999999,
        gpu_layers: 999999,
        threads: 999999
      }
    });
    mockLocalStorage.getItem.mockReturnValue(largeConfig);

    // Act: Render large config
    render(<ConfigurationPage />);

    // Assert: Component renders
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('handles special characters in basePath', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Use special characters
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    const specialPath = '/path/with/@#$%^&*()_+[]{}|;:"<>?`-';
    fireEvent.change(basePathInput, { target: { value: specialPath } });

    // Assert: Special characters accepted
    expect(basePathInput).toHaveValue(specialPath);
  });

  it('handles unicode characters in configuration', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Use unicode
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    const unicodePath = '/路径/with/模型/和/汉字';
    fireEvent.change(basePathInput, { target: { value: unicodePath } });

    // Assert: Unicode accepted
    expect(basePathInput).toHaveValue(unicodePath);
  });

  it('handles null config value from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('null');

    // Act: Render with null
    render(<ConfigurationPage />);

    // Assert: Defaults used
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('handles empty object from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('{}');

    // Act: Render with empty object
    render(<ConfigurationPage />);

    // Assert: Defaults used
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/home/user/models')).toBeInTheDocument();
  });

  it('handles API response with invalid data', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    });

    // Act: Save
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Success shown (API returns ok)
    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });
  });

  it('handles API response with 500 error', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Act: Save with 500 error
    render(<ConfigurationPage />);
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Assert: Fallback message shown
    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    });
  });

  it('handles checkbox rapid toggling', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Rapidly toggle checkbox (20 clicks = even number)
    const checkboxes = screen.getAllByRole('checkbox');
    const autoUpdateCheckbox = checkboxes[0] as HTMLInputElement;

    for (let i = 0; i < 20; i++) {
      fireEvent.click(autoUpdateCheckbox);
    }

    // Assert: Final state is true (even number of clicks from initial true)
    expect(autoUpdateCheckbox.checked).toBe(true);
  });

  it('handles form submission with Enter key', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act: Press Enter in input
    render(<ConfigurationPage />);
    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.keyDown(basePathInput, { key: 'Enter', code: 'Enter' });

    // Assert: Component still renders (no form submit handler)
    expect(screen.getByText('Save Configuration')).toBeInTheDocument();
  });

  it('handles logLevel with invalid values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Set invalid log level
    const logLevelInput = screen.getByDisplayValue('info');
    fireEvent.change(logLevelInput, { target: { value: 'invalid-log-level' } });

    // Assert: Invalid value accepted (no validation)
    expect(logLevelInput).toHaveValue('invalid-log-level');
  });

  it('handles batch size and top k parameter changes', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    // Act: Switch to model defaults and change values
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    // Change batch size
    const batchSizeInput = screen.getByDisplayValue('2048');
    fireEvent.change(batchSizeInput, { target: { value: '4096' } });
    expect(batchSizeInput).toHaveValue(4096);

    // Change top k (already tested but let's verify again)
    const topKInput = screen.getByDisplayValue('40');
    fireEvent.change(topKInput, { target: { value: '50' } });
    expect(topKInput).toHaveValue(50);
  });

  it('displays correct button text based on active tab', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ConfigurationPage />);

    // General tab save button
    const saveButton1 = screen.getByText('Save Configuration');
    expect(saveButton1).toBeInTheDocument();

    // Switch to model defaults
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);

    // Model defaults tab save button
    const saveButton2 = screen.getByText('Save Model Defaults');
    expect(saveButton2).toBeInTheDocument();
  });
});
