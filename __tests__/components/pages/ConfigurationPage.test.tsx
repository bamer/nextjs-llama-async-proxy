import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ConfigurationPage from '@/components/pages/ConfigurationPage';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with default config', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('General Settings')).toBeInTheDocument();
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
  });

  it('renders tabs correctly', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Model Default Parameters')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);
    
    expect(screen.getByText('Model Default Parameters')).toBeInTheDocument();
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
    saveButton.onclick = jest.fn();
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
    saveButton.onclick = jest.fn();
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
    
    expect(saveButton).toBeDisabled();
  });

  it('displays saving text while saving', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );
    
    render(<ConfigurationPage />);
    
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders model defaults tab inputs', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
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
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);
    
    const ctxSizeInput = screen.getByDisplayValue('4096');
    fireEvent.change(ctxSizeInput, { target: { value: '8192' } });
    
    expect(ctxSizeInput).toHaveValue(8192);
  });

  it('updates temperature', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);
    
    const tempInput = screen.getByDisplayValue('0.8');
    fireEvent.change(tempInput, { target: { value: '0.5' } });
    
    expect(tempInput).toHaveValue(0.5);
  });

  it('updates top p', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);
    
    const topPInput = screen.getByDisplayValue('0.9');
    fireEvent.change(topPInput, { target: { value: '0.7' } });
    
    expect(topPInput).toHaveValue(0.7);
  });

  it('updates top k', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);
    
    const topKInput = screen.getByDisplayValue('40');
    fireEvent.change(topKInput, { target: { value: '50' } });
    
    expect(topKInput).toHaveValue(50);
  });

  it('updates gpu layers', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
    fireEvent.click(modelDefaultsTab);
    
    const gpuLayersInput = screen.getByDisplayValue('-1');
    fireEvent.change(gpuLayersInput, { target: { value: '35' } });
    
    expect(gpuLayersInput).toHaveValue(35);
  });

  it('updates cpu threads', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<ConfigurationPage />);
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
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
    
    const modelDefaultsTab = screen.getByText('Model Default Parameters');
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
});
