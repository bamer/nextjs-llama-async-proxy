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

  it('renders correctly with default config', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getAllByText('General Settings')).toHaveLength(2); // Tab button and heading
  });

  it('loads config from localStorage on mount', () => {
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

    render(<ConfigurationPage />);

    expect(screen.getByDisplayValue('/custom/path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('debug')).toBeInTheDocument();
  });

  it('handles malformed localStorage config gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json');

    render(<ConfigurationPage />);

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it('renders tabs correctly', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    expect(screen.getAllByText('General Settings')).toHaveLength(2);
    expect(screen.getAllByText('Model Default Parameters')).toHaveLength(2);
  });

  it('switches between tabs', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    expect(screen.getAllByText('Model Default Parameters')).toHaveLength(2);
  });

  it('updates input fields', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.change(basePathInput, { target: { value: '/new/path' } });

    expect(basePathInput).toHaveValue('/new/path');
  });

  it('updates log level', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const logLevelInput = screen.getByDisplayValue('info');
    fireEvent.change(logLevelInput, { target: { value: 'debug' } });

    expect(logLevelInput).toHaveValue('debug');
  });

  it('updates max concurrent models', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '10' } });

    expect(maxModelsInput).toHaveValue(10);
  });

  it('toggles auto update checkbox', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const autoUpdateCheckbox = screen.getByLabelText(/auto update/i) as HTMLInputElement;
    expect(autoUpdateCheckbox.checked).toBe(true);

    fireEvent.click(autoUpdateCheckbox);
    expect(autoUpdateCheckbox.checked).toBe(false);
  });

  it('toggles notifications enabled checkbox', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const notificationsCheckbox = screen.getByLabelText(/notifications enabled/i) as HTMLInputElement;
    expect(notificationsCheckbox.checked).toBe(true);

    fireEvent.click(notificationsCheckbox);
    expect(notificationsCheckbox.checked).toBe(false);
  });

  it('saves configuration to localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  it('shows success message on successful save', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });
  });

  it('shows fallback message when API is unavailable', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    });
  });

  it('shows error message on save failure', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  it('disables save button while saving', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('displays saving text while saving', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('renders model defaults tab inputs', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    expect(screen.getByDisplayValue('4096')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2048')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.9')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
  });

  it('updates context size', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const ctxSizeInput = screen.getByDisplayValue('4096');
    fireEvent.change(ctxSizeInput, { target: { value: '8192' } });

    expect(ctxSizeInput).toHaveValue(8192);
  });

  it('updates temperature', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const tempInput = screen.getByDisplayValue('0.8');
    fireEvent.change(tempInput, { target: { value: '0.5' } });

    expect(tempInput).toHaveValue(0.5);
  });

  it('updates top p', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const topPInput = screen.getByDisplayValue('0.9');
    fireEvent.change(topPInput, { target: { value: '0.7' } });

    expect(topPInput).toHaveValue(0.7);
  });

  it('updates top k', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const topKInput = screen.getByDisplayValue('40');
    fireEvent.change(topKInput, { target: { value: '50' } });

    expect(topKInput).toHaveValue(50);
  });

  it('updates gpu layers', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const gpuLayersInput = screen.getByDisplayValue('-1');
    fireEvent.change(gpuLayersInput, { target: { value: '35' } });

    expect(gpuLayersInput).toHaveValue(35);
  });

  it('updates cpu threads', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const threadsInput = screen.getByDisplayValue('-1');
    fireEvent.change(threadsInput, { target: { value: '8' } });

    expect(threadsInput).toHaveValue(8);
  });

  it('saves model defaults configuration', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const saveButton = screen.getByText('Save Model Defaults');
    fireEvent.click(saveButton);

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

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Configuration saved successfully!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  // Edge Case Tests
  it('handles very long configuration values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const basePathInput = screen.getByDisplayValue('/home/user/models');
    const longPath = '/'.repeat(5000);
    fireEvent.change(basePathInput, { target: { value: longPath } });

    expect(basePathInput).toHaveValue(longPath);
  });

  it('handles empty configuration values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.change(basePathInput, { target: { value: '' } });

    expect(basePathInput).toHaveValue('');
  });

  it('handles negative maxConcurrentModels value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '-10' } });

    expect(maxModelsInput).toHaveValue(-10);
  });

  it('handles very large maxConcurrentModels value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const maxModelsInput = screen.getByDisplayValue('5');
    fireEvent.change(maxModelsInput, { target: { value: '999999999' } });

    expect(maxModelsInput).toHaveValue(999999999);
  });

  it('handles temperature at boundary values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
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

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
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

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
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

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
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

    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];
    fireEvent.click(modelDefaultsTab);

    const gpuLayersInput = screen.getByDisplayValue('-1');
    fireEvent.change(gpuLayersInput, { target: { value: '-100' } });
    expect(gpuLayersInput).toHaveValue(-100);
  });

  it('handles rapid tab switching', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const generalTab = screen.getAllByText('General Settings')[0];
    const modelDefaultsTab = screen.getAllByText('Model Default Parameters')[0];

    for (let i = 0; i < 10; i++) {
      fireEvent.click(generalTab);
      fireEvent.click(modelDefaultsTab);
    }

    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Model Default Parameters')).toBeInTheDocument();
  });

  it('handles concurrent save attempts', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
  });

  it('handles localStorage quota exceeded error', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      (error as any).name = 'QuotaExceededError';
      throw error;
    });

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

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

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles partial configuration in localStorage', () => {
    const partialConfig = JSON.stringify({
      basePath: '/partial/path',
      // Missing other fields
    });
    mockLocalStorage.getItem.mockReturnValue(partialConfig);

    render(<ConfigurationPage />);

    expect(screen.getByDisplayValue('/partial/path')).toBeInTheDocument();
    // Should use defaults for missing fields
    expect(screen.getByDisplayValue('info')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('handles invalid JSON in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('{ invalid json }');

    render(<ConfigurationPage />);

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

    render(<ConfigurationPage />);

    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('handles special characters in basePath', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const basePathInput = screen.getByDisplayValue('/home/user/models');
    const specialPath = '/path/with/@#$%^&*()_+[]{}|;:"<>?`-';
    fireEvent.change(basePathInput, { target: { value: specialPath } });

    expect(basePathInput).toHaveValue(specialPath);
  });

  it('handles unicode characters in configuration', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const basePathInput = screen.getByDisplayValue('/home/user/models');
    const unicodePath = '/路径/with/模型/和/汉字';
    fireEvent.change(basePathInput, { target: { value: unicodePath } });

    expect(basePathInput).toHaveValue(unicodePath);
  });

  it('handles null config value from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('null');

    render(<ConfigurationPage />);

    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('handles empty object from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('{}');

    render(<ConfigurationPage />);

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    // Should use defaults
    expect(screen.getByDisplayValue('/home/user/models')).toBeInTheDocument();
  });

  it('handles API response with invalid data', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    });

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

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

    render(<ConfigurationPage />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved locally (API unavailable)')).toBeInTheDocument();
    });
  });

  it('handles checkbox rapid toggling', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const autoUpdateCheckbox = screen.getByLabelText(/auto update/i) as HTMLInputElement;

    for (let i = 0; i < 20; i++) {
      fireEvent.click(autoUpdateCheckbox);
    }

    expect(autoUpdateCheckbox.checked).toBe(false); // Should end in opposite state
  });

  it('handles form submission with Enter key', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ConfigurationPage />);

    const basePathInput = screen.getByDisplayValue('/home/user/models');
    fireEvent.keyDown(basePathInput, { key: 'Enter', code: 'Enter' });

    // Note: The component doesn't have form submit handler, so this should not trigger save
    expect(screen.getByText('Save Configuration')).toBeInTheDocument();
  });

  it('handles logLevel with invalid values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);

    const logLevelInput = screen.getByDisplayValue('info');
    fireEvent.change(logLevelInput, { target: { value: 'invalid-log-level' } });

    expect(logLevelInput).toHaveValue('invalid-log-level');
  });
});
