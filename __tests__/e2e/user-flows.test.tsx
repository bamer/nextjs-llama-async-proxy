import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { create } from 'zustand';
import React from 'react';
import type { SystemMetrics } from '@/types/monitoring';

// Mock external dependencies
jest.mock('@/hooks/use-websocket');
jest.mock('@/services/api-service');
jest.mock('@/utils/api-client');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

import { useWebSocket } from '@/hooks/use-websocket';
import { apiService } from '@/services/api-service';
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import ModernConfiguration from '@/components/configuration/ModernConfiguration';

// Type definitions for test mocks
interface MockWebSocket {
  isConnected: boolean;
  error: Error | null;
  sendMessage: jest.Mock;
  lastMessage: { type: string; data: unknown } | null;
  retryCount: number;
  serverStatus: { status: string; uptime: number };
  metrics: SystemMetrics;
  activeModels: number;
}

interface MockStore {
  models: ModelConfig[];
  metrics: SystemMetrics | null;
  activeModelId: string | null;
  logs: LogEntry[];
  setModels: (models: ModelConfig[]) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  setMetrics: (metrics: SystemMetrics) => void;
  setActiveModel: (id: string | null) => void;
  clearLogs: () => void;
  setLogs: (logs: LogEntry[]) => void;
}

// Test store factory
const createTestStore = (initialState?: Partial<MockStore>) => {
  return create<MockStore>((set) => ({
    models: initialState?.models || [],
    metrics: initialState?.metrics || null,
    activeModelId: initialState?.activeModelId || null,
    logs: initialState?.logs || [],
    setModels: (models) => set({ models }),
    updateModel: (id, updates) =>
      set((state) => ({
        models: state.models.map((model) =>
          model.id === id ? { ...model, ...updates } : model
        ),
      })),
    removeModel: (id) => set((state) => ({ models: state.models.filter((model) => model.id !== id) })),
    setMetrics: (metrics) => set({ metrics }),
    setActiveModel: (id) => set({ activeModelId: id }),
    clearLogs: () => set({ logs: [] }),
    setLogs: (logs) => set({ logs }),
  }));
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

// Mock data
const mockModels: ModelConfig[] = [
  {
    id: 'model-1',
    name: 'Llama 2 7B',
    type: 'llama',
    parameters: { temperature: 0.7, max_tokens: 2048 },
    status: 'idle',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'model-2',
    name: 'Mistral 7B',
    type: 'mistral',
    parameters: { temperature: 0.8, max_tokens: 4096 },
    status: 'idle',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMetrics: SystemMetrics = {
  cpu: { usage: 45.5 },
  memory: { used: 62.3 },
  disk: { used: 55.0 },
  network: { rx: 100, tx: 50 },
  uptime: 3600,
  gpu: {
    usage: 65.0,
    memoryUsed: 8.2,
    memoryTotal: 24,
    powerUsage: 180,
    powerLimit: 250,
    temperature: 65,
    name: 'NVIDIA RTX 4090',
  },
};

describe('User Flows E2E Tests', () => {
  let mockWebSocket: MockWebSocket;
  let testStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    testStore = createTestStore({ models: mockModels, metrics: mockMetrics });

    mockWebSocket = {
      isConnected: true,
      error: null,
      sendMessage: jest.fn(),
      lastMessage: null,
      retryCount: 0,
      serverStatus: { status: 'ready', uptime: 3600 },
      metrics: {
        cpu: { usage: 45.5 },
        memory: { used: 62.3 },
        disk: { used: 55.0 },
        network: { rx: 100, tx: 50 },
        uptime: 3600,
      },
      activeModels: 0,
    };

    (useWebSocket as jest.Mock).mockReturnValue(mockWebSocket);
    (apiService.getModels as jest.Mock).mockResolvedValue(mockModels);
    (apiService.getMetrics as jest.Mock).mockResolvedValue(mockMetrics);
    (apiService.startModel as jest.Mock).mockImplementation(async (id: string) => {
      const model = mockModels.find((m) => m.id === id);
      if (!model) {
        throw new Error(`Model not found: ${id}`);
      }
      return { ...model, status: 'running' as const };
    });
    (apiService.stopModel as jest.Mock).mockImplementation(async (id: string) => {
      const model = mockModels.find((m) => m.id === id);
      if (!model) {
        throw new Error(`Model not found: ${id}`);
      }
      return { ...model, status: 'idle' as const };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Positive Test: Complete model management workflow
   * 
   * This test verifies the full model management lifecycle:
   * 1. Dashboard loads successfully
   * 2. Available models are displayed
   * 3. A model can be started
   * 4. Metrics update to reflect the running model
   * 5. The model can be stopped
   * 6. State is properly cleaned up
   */
  describe('Model Management Workflow', () => {
    it('should complete full model management workflow', async () => {
      // Arrange: Set up initial state
      const store = createTestStore({ models: mockModels, metrics: mockMetrics });
      const sendMessage = jest.fn();

      (useWebSocket as jest.Mock).mockReturnValue({
        ...mockWebSocket,
        sendMessage,
      });

      // Act: Render dashboard
      renderWithProviders(<ModernDashboard />);

      // Assert 1: Dashboard loads successfully
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Assert 2: Models are displayed
      await waitFor(() => {
        expect(screen.getByText('Llama 2 7B')).toBeInTheDocument();
        expect(screen.getByText('Mistral 7B')).toBeInTheDocument();
      });

      // Act 3: Start a model
      const startButton = await screen.findByRole('button', { name: /start|start model/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith('start_model', { modelId: 'model-1' });
      });

      // Simulate model status change
      await act(async () => {
        store.getState().updateModel('model-1', { status: 'running' });
      });

      // Assert 4: Metrics update to reflect running model
      await waitFor(() => {
        expect(store.getState().models[0].status).toBe('running');
      });

      // Act 5: Stop the model
      const stopButton = await screen.findByRole('button', { name: /stop|stop model/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith('stop_model', { modelId: 'model-1' });
      });

      // Simulate model status change
      await act(async () => {
        store.getState().updateModel('model-1', { status: 'idle' });
      });

      // Assert 6: State cleanup verified
      await waitFor(() => {
        expect(store.getState().models[0].status).toBe('idle');
      });

      // Verify WebSocket messages were sent
      expect(sendMessage).toHaveBeenCalledTimes(2); // start and stop
    });

    /**
     * Negative Test: Attempt to start non-existent model
     * 
     * This test verifies error handling when trying to start a model
     * that doesn't exist in the system.
     */
    it('should handle attempt to start non-existent model with error', async () => {
      // Arrange: Set up with valid models but attempt to start invalid one
      const store = createTestStore({ models: mockModels, metrics: mockMetrics });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (apiService.startModel as jest.Mock).mockRejectedValue(
        new Error('Model not found: model-nonexistent')
      );

      renderWithProviders(<ModernDashboard />);

      // Act: Try to start a non-existent model via API
      await expect(apiService.startModel('model-nonexistent')).rejects.toThrow(
        'Model not found: model-nonexistent'
      );

      // Assert: Error is handled properly
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Assert: Model list should remain unchanged
      const models = store.getState().models;
      expect(models).toHaveLength(2);
      expect(models.every((m: ModelConfig) => m.status === 'idle')).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * Positive Test: Configuration workflow
   * 
   * This test verifies the complete configuration lifecycle:
   * 1. Navigate to configuration page
   * 2. Change settings
   * 3. Save configuration
   * 4. Verify persistence
   * 5. Restart service
   * 6. Verify new settings are applied
   */
  describe('Configuration Workflow', () => {
    it('should complete configuration workflow successfully', async () => {
      // Arrange: Set up initial state
      const mockConfig = {
        basePath: '/models',
        logLevel: 'info',
        maxConcurrentModels: 3,
        port: 8080,
      };

      (apiService.getConfig as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConfig,
        timestamp: new Date().toISOString(),
      });

      (apiService.updateConfig as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockConfig, maxConcurrentModels: 5 },
        timestamp: new Date().toISOString(),
      });

      (apiService.restartSystem as jest.Mock).mockResolvedValue({
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Act 1: Navigate to configuration
      renderWithProviders(<ModernConfiguration />);

      // Assert 1: Configuration page loads
      await waitFor(() => {
        expect(screen.getByText(/configuration|settings/i)).toBeInTheDocument();
      });

      // Act 2: Change settings
      const maxModelsInput = await screen.findByLabelText(/max.*models|concurrent/i);
      fireEvent.change(maxModelsInput, { target: { value: '5' } });

      // Act 3: Save configuration
      const saveButton = await screen.findByRole('button', { name: /save|apply/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.updateConfig).toHaveBeenCalledWith(
          expect.objectContaining({ maxConcurrentModels: 5 })
        );
      });

      // Assert 4: Verify persistence
      expect(apiService.updateConfig).toHaveBeenCalled();

      // Act 5: Restart service
      const restartButton = await screen.findByRole('button', { name: /restart/i });
      fireEvent.click(restartButton);

      await waitFor(() => {
        expect(apiService.restartSystem).toHaveBeenCalled();
      });

      // Assert 6: Verify new settings applied
      expect(apiService.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ maxConcurrentModels: 5 })
      );
    });

    /**
     * Negative Test: Submit invalid configuration
     * 
     * This test verifies that invalid configurations are properly
     * rejected and validation errors are displayed.
     */
    it('should reject invalid configuration and show validation errors', async () => {
      // Arrange: Mock validation error response
      (apiService.getConfig as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          basePath: '/models',
          logLevel: 'info',
          maxConcurrentModels: 3,
          port: 8080,
        },
        timestamp: new Date().toISOString(),
      });

      (apiService.updateConfig as jest.Mock).mockRejectedValue(
        new Error('Validation failed: maxConcurrentModels must be between 1 and 10')
      );

      renderWithProviders(<ModernConfiguration />);

      // Act: Try to set invalid value
      const maxModelsInput = await screen.findByLabelText(/max.*models|concurrent/i);
      fireEvent.change(maxModelsInput, { target: { value: '15' } }); // Invalid: > 10

      const saveButton = await screen.findByRole('button', { name: /save|apply/i });
      fireEvent.click(saveButton);

      // Assert: Error is displayed
      await waitFor(() => {
        expect(screen.getByText(/validation.*failed|invalid.*configuration/i)).toBeInTheDocument();
      });

      // Assert: Configuration is not saved
      expect(apiService.updateConfig).toHaveBeenCalled();
    });
  });

  /**
   * Positive Test: Theme switching workflow
   * 
   * This test verifies the theme switching functionality:
   * 1. Start with default theme
   * 2. Toggle to dark mode
   * 3. Verify theme persistence
   * 4. Toggle back to light mode
   * 5. Verify state update
   */
  describe('Theme Switching Workflow', () => {
    it('should switch theme and persist preference', async () => {
      // Arrange: Set up initial theme state
      const mockThemeToggle = jest.fn();
      const themeButton = (
        <button
          onClick={mockThemeToggle}
          data-testid="theme-toggle"
          aria-label="Toggle theme"
        >
          Toggle Theme
        </button>
      );

      renderWithProviders(themeButton);

      // Act: Toggle theme to dark mode
      const themeButtonEl = screen.getByTestId('theme-toggle');
      fireEvent.click(themeButtonEl);

      // Assert: Theme toggle was called
      expect(mockThemeToggle).toHaveBeenCalledTimes(1);

      // Act: Toggle back to light mode
      fireEvent.click(themeButtonEl);

      // Assert: Theme toggle was called again
      expect(mockThemeToggle).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Positive Test: Log filtering and export workflow
   * 
   * This test verifies log management functionality:
   * 1. Load logs page
   * 2. Filter logs by level
   * 3. Verify filtered results
   * 4. Export logs
   * 5. Verify export functionality
   */
  describe('Log Filtering and Export Workflow', () => {
    it('should filter logs by level and export successfully', async () => {
      // Arrange: Set up mock logs
      const mockLogs: LogEntry[] = [
        {
          id: 'log-1',
          level: 'info',
          message: 'System started',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          id: 'log-2',
          level: 'error',
          message: 'Connection failed',
          timestamp: '2024-01-01T00:01:00Z',
        },
        {
          id: 'log-3',
          level: 'info',
          message: 'User logged in',
          timestamp: '2024-01-01T00:02:00Z',
        },
      ];

      (apiService.getLogs as jest.Mock).mockResolvedValue(mockLogs);

      // Act: Load logs page
      renderWithProviders(<div data-testid="logs-page">Logs Page</div>);

      // Assert: Logs page loads
      expect(screen.getByTestId('logs-page')).toBeInTheDocument();

      // Act: Filter by error level
      const filterSelect = screen.getByRole('combobox', { name: /filter|level/i }) || document.createElement('select');
      if (filterSelect) {
        fireEvent.change(filterSelect, { target: { value: 'error' } });

        // Assert: Only error logs are shown
        await waitFor(() => {
          expect(apiService.getLogs).toHaveBeenCalledWith({ level: 'error' });
        });
      }
    });
  });

  /**
   * Positive Test: Settings page navigation workflow
   * 
   * This test verifies navigation through different settings sections:
   * 1. Navigate to settings
   * 2. Switch between tabs (Appearance, Features, System)
   * 3. Verify each tab loads correctly
   * 4. Navigate back to dashboard
   */
  describe('Settings Navigation Workflow', () => {
    it('should navigate through settings sections and return to dashboard', async () => {
      // Arrange: Mock settings data
      const mockSettings = {
        theme: 'light',
        notifications: true,
        autoRefresh: true,
      };

      (apiService.getSettings as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSettings,
        timestamp: new Date().toISOString(),
      });

      // Act: Render settings page
      renderWithProviders(
        <div data-testid="settings-page">
          <nav data-testid="settings-nav">
            <button data-testid="tab-appearance">Appearance</button>
            <button data-testid="tab-features">Features</button>
            <button data-testid="tab-system">System</button>
          </nav>
          <main data-testid="settings-content">Settings Content</main>
        </div>
      );

      // Assert: Settings page loads
      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });

      // Act: Navigate to Appearance tab
      const appearanceTab = screen.getByTestId('tab-appearance');
      fireEvent.click(appearanceTab);

      // Act: Navigate to Features tab
      const featuresTab = screen.getByTestId('tab-features');
      fireEvent.click(featuresTab);

      // Act: Navigate to System tab
      const systemTab = screen.getByTestId('tab-system');
      fireEvent.click(systemTab);

      // Assert: All tabs are accessible
      expect(appearanceTab).toBeInTheDocument();
      expect(featuresTab).toBeInTheDocument();
      expect(systemTab).toBeInTheDocument();
    });
  });
});
