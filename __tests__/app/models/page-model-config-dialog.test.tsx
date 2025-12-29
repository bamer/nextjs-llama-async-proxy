/**
 * Integration tests for ModelConfigDialog on Models Page
 *
 * Tests verify that dialog opens correctly when clicking configuration buttons
 * for different config types (Sampling, Memory, GPU, Advanced, LoRA, Multimodal)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelsPage from '../../../app/models/page';
import { useStore } from '@/lib/store';

// Mock MainLayout component
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

// Mock ErrorBoundary
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
    <div data-testid="error-boundary">{children || fallback}</div>
  ),
}));

// Mock ModelsFallback
jest.mock('@/components/ui/error-fallbacks', () => ({
  ModelsFallback: () => <div data-testid="models-fallback">Error loading models</div>,
}));

// Mock SkeletonCard
jest.mock('@/components/ui', () => ({
  SkeletonCard: ({ height }: { height?: string | number }) => (
    <div data-testid="skeleton-card" style={{ height }}>Loading...</div>
  ),
}));

// Mock WebSocket hook with event handlers tracking
const mockEventHandlers: Record<string, ((data: unknown) => void)[]> = {};
const mockSendMessage = jest.fn();

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    sendMessage: mockSendMessage,
    on: jest.fn((event: string, handler: (data: unknown) => void) => {
      if (!mockEventHandlers[event]) {
        mockEventHandlers[event] = [];
      }
      mockEventHandlers[event].push(handler);
    }),
    off: jest.fn((event: string, handler: (data: unknown) => void) => {
      if (mockEventHandlers[event]) {
        mockEventHandlers[event] = mockEventHandlers[event].filter((h) => h !== handler);
      }
    }),
    requestModels: jest.fn(),
    isConnected: true,
  }),
}));

// Cast event handlers to fix TypeScript errors
const getEventHandler = (event: string): ((data: unknown) => void) | undefined => {
  const handlers = mockEventHandlers[event] as ((data: unknown) => void)[];
  return handlers && handlers.length > 0 ? handlers[0] : undefined;
};

// Mock useEffectEvent
jest.mock('@/hooks/use-effect-event', () => ({
  useEffectEvent: (fn: any) => fn,
}));

// Mock ModelConfigDialog - simplified version for testing
jest.mock('@/components/ui/ModelConfigDialog', () => ({
  default: ({ open, modelId, configType, onClose, onSave }: any) => {
    // Simple mock that doesn't use complex MUI components
    return open ? (
      <div data-testid="model-config-dialog" data-open="true">
        <div data-testid="dialog-title">Configure {configType} for Model {modelId}</div>
        <button data-testid="cancel-button" onClick={onClose}>Cancel</button>
        <button data-testid="save-button" onClick={() => onSave({ temperature: 0.7 })}>Save Configuration</button>
      </div>
    ) : null;
  },
  ConfigType: {} as any,
}));

// Mock server actions
jest.mock('@/actions/config-actions', () => ({
  loadModelConfig: jest.fn(),
  saveModelConfig: jest.fn(),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() }),
}));

// Mock fetch
global.fetch = jest.fn();

// Sample model data matching the store structure
const mockStoreModel = {
  id: '1',
  name: 'llama-2-7b',
  type: 'llama' as const,
  status: 'idle' as const,
  parameters: {
    ctx_size: 2048,
    batch_size: 512,
    threads: 4,
  },
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

describe('ModelsPage - ModelConfigDialog Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockEventHandlers).forEach((key) => delete mockEventHandlers[key]);
    mockSendMessage.mockClear();

    // Set up mock fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  /**
   * Test 1: Dialog opens when clicking Sampling button
   * Verifies that clicking the Sampling configuration button triggers the dialog
   * with correct parameters for the sampling config type
   */
  it('should open dialog when clicking Sampling button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Find the Sampling button for the model
    const samplingButton = screen.getByText('Sampling');

    // Act: Click the Sampling button
    fireEvent.click(samplingButton);

    // Assert: Verify that sendMessage was called with load_config
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1, // Converted to number by storeToModelData
      type: 'sampling',
    });
  });

  /**
   * Test 2: Dialog opens when clicking Memory button
   * Verifies that clicking the Memory configuration button triggers the dialog
   * with correct parameters for the memory config type
   */
  it('should open dialog when clicking Memory button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Find the Memory button for the model
    const memoryButton = screen.getByText('Memory');

    // Act: Click the Memory button
    fireEvent.click(memoryButton);

    // Assert: Verify that sendMessage was called with load_config for memory
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'memory',
    });
  });

  /**
   * Test 3: Dialog opens when clicking GPU button
   * Verifies that clicking the GPU configuration button triggers the dialog
   * with correct parameters for the gpu config type
   */
  it('should open dialog when clicking GPU button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Find the GPU button for the model
    const gpuButton = screen.getByText('GPU');

    // Act: Click the GPU button
    fireEvent.click(gpuButton);

    // Assert: Verify that sendMessage was called with load_config for gpu
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'gpu',
    });
  });

  /**
   * Test 4: Dialog opens when clicking Advanced button
   * Verifies that clicking the Advanced configuration button triggers the dialog
   * with correct parameters for the advanced config type
   */
  it('should open dialog when clicking Advanced button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Find the Advanced button for the model
    const advancedButton = screen.getByText('Advanced');

    // Act: Click the Advanced button
    fireEvent.click(advancedButton);

    // Assert: Verify that sendMessage was called with load_config for advanced
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'advanced',
    });
  });

  /**
   * Test 5: Dialog opens when clicking LoRA button
   * Verifies that clicking the LoRA configuration button triggers the dialog
   * with correct parameters for the lora config type
   */
  it('should open dialog when clicking LoRA button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Find the LoRA button for the model
    const loraButton = screen.getByText('LoRA');

    // Act: Click the LoRA button
    fireEvent.click(loraButton);

    // Assert: Verify that sendMessage was called with load_config for lora
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'lora',
    });
  });

  /**
   * Test 6: Dialog opens when clicking Multi button
   * Verifies that clicking the Multimodal configuration button triggers the dialog
   * with correct parameters for the multimodal config type
   */
  it('should open dialog when clicking Multi button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Find the Multi button for the model
    const multiButton = screen.getByText('Multi');

    // Act: Click the Multi button
    fireEvent.click(multiButton);

    // Assert: Verify that sendMessage was called with load_config for multimodal
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'multimodal',
    });
  });

  /**
   * Test 7: Dialog displays correct model data
   * Verifies that when config_loaded event is triggered, the dialog opens
   * and displays the correct model ID and config type
   */
  it('should display correct model data in dialog after config_loaded event', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Click the Sampling button
    const samplingButton = screen.getByText('Sampling');
    fireEvent.click(samplingButton);

    // Simulate config_loaded WebSocket event
    const configData = {
      temperature: 0.7,
      top_k: 40,
      top_p: 0.9,
    };

    await act(async () => {
      // Find and trigger the config_loaded event handler
      if (mockEventHandlers['config_loaded'] && mockEventHandlers['config_loaded'].length > 0) {
        const handler = mockEventHandlers['config_loaded'][0];
        handler({
          success: true,
          data: {
            id: 1,
            type: 'sampling',
            config: configData,
          },
        });
      }
    });

    // Assert: Verify dialog is open with correct title
    await waitFor(() => {
      expect(screen.getByText(/Configure Sampling for Model 1/)).toBeInTheDocument();
    });
  });

  /**
   * Test 8: Dialog closes on close callback
   * Verifies that the dialog can be closed by clicking the Cancel button
   * or triggering the onClose callback
   */
  it('should close dialog when clicking Cancel button', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Click the Sampling button
    const samplingButton = screen.getByText('Sampling');
    fireEvent.click(samplingButton);

    // Simulate config_loaded WebSocket event to open dialog
    await act(async () => {
      if (mockEventHandlers['config_loaded'] && mockEventHandlers['config_loaded'].length > 0) {
        const handler = mockEventHandlers['config_loaded'][0];
        handler({
          success: true,
          data: {
            id: 1,
            type: 'sampling',
            config: { temperature: 0.7 },
          },
        });
      }
    });

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText(/Configure Sampling for Model 1/)).toBeInTheDocument();
    });

    // Act: Click the Cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Assert: Dialog should be closed (title should not be in document)
    await waitFor(() => {
      expect(screen.queryByText(/Configure Sampling for Model 1/)).not.toBeInTheDocument();
    });
  });

  /**
   * Test 9: Multiple configuration buttons should work independently
   * Verifies that different config types can be opened and closed
   * without interfering with each other
   */
  it('should handle multiple config types independently', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Act: Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Click Memory button
    const memoryButton = screen.getByText('Memory');
    fireEvent.click(memoryButton);

    // Verify load_config was called for memory
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'memory',
    });

    // Click GPU button
    const gpuButton = screen.getByText('GPU');
    fireEvent.click(gpuButton);

    // Verify load_config was called for gpu
    expect(mockSendMessage).toHaveBeenCalledWith('load_config', {
      id: 1,
      type: 'gpu',
    });

    // Both calls should have been made
    expect(mockSendMessage).toHaveBeenCalledTimes(2);
  });

  /**
   * Test 10: Dialog sends save_config message when saving
   * Verifies that clicking Save Configuration sends a WebSocket message
   * with the correct parameters
   */
  it('should send save_config message when saving configuration', async () => {
    // Arrange: Set up store with model data
    useStore.getState().setModels([mockStoreModel]);

    // Render the models page
    render(<ModelsPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    // Click the Sampling button
    const samplingButton = screen.getByText('Sampling');
    fireEvent.click(samplingButton);

    // Simulate config_loaded WebSocket event to open dialog
    await act(async () => {
      if (mockEventHandlers['config_loaded'] && mockEventHandlers['config_loaded'].length > 0) {
        const handler = mockEventHandlers['config_loaded'][0];
        handler({
          success: true,
          data: {
            id: 1,
            type: 'sampling',
            config: { temperature: 0.7 },
          },
        });
      }
    });

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText(/Configure Sampling for Model 1/)).toBeInTheDocument();
    });

    // Clear previous sendMessage calls
    mockSendMessage.mockClear();

    // Act: Make a change to enable the save button, then click Save
    const temperatureField = screen.getByLabelText(/Temperature/i);
    fireEvent.change(temperatureField, { target: { value: '0.8' } });

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // Simulate config_saved event to close dialog
    await act(async () => {
      if (mockEventHandlers['config_saved'] && mockEventHandlers['config_saved'].length > 0) {
        const handler = mockEventHandlers['config_saved'][0];
        handler({
          success: true,
          data: {
            id: 1,
            type: 'sampling',
            config: { temperature: 0.8 },
          },
        });
      }
    });

    // Assert: save_config message should have been sent
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('save_config', {
        id: 1,
        type: 'sampling',
        config: expect.objectContaining({ temperature: 0.8 }),
      });
    });
  });
});
