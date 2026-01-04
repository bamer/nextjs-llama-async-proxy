import { setupStoreModel } from './test-utils';
import ModelsPage from '@/app/models/page';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
    <div data-testid="error-boundary">{children || fallback}</div>
  ),
}));

jest.mock('@/components/ui/error-fallbacks', () => ({
  ModelsFallback: () => <div data-testid="models-fallback">Error loading models</div>,
}));

jest.mock('@/components/ui', () => ({
  SkeletonCard: ({ height }: { height?: string | number }) => (
    <div data-testid="skeleton-card" style={{ height }}>Loading...</div>
  ),
}));

const mockSendMessage = jest.fn();

const mockEventHandlers: Record<string, ((data: unknown) => void)[]> = {};

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

jest.mock('@/hooks/use-effect-event', () => ({
  useEffectEvent: (fn: any) => fn,
}));

jest.mock('@/components/ui/ModelConfigDialog', () => ({
  default: ({ open, modelId, configType, onClose, onSave }: any) => {
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

jest.mock('@/actions/config-actions', () => ({
  loadModelConfig: jest.fn(),
  saveModelConfig: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() }),
}));

global.fetch = jest.fn();

describe('ModelsPage - ModelConfigDialog Save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockEventHandlers).forEach((key) => delete mockEventHandlers[key]);
    mockSendMessage.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should send save_config message when saving configuration', async () => {
    setupStoreModel();
    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('llama-2-7b')).toBeInTheDocument();
    });

    const samplingButton = screen.getByText('Sampling');
    fireEvent.click(samplingButton);

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

    await waitFor(() => {
      expect(screen.getByText(/Configure Sampling for Model 1/)).toBeInTheDocument();
    });

    mockSendMessage.mockClear();

    const temperatureField = screen.getByLabelText(/Temperature/i);
    fireEvent.change(temperatureField, { target: { value: '0.8' } });

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

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

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('save_config', {
        id: 1,
        type: 'sampling',
        config: expect.objectContaining({ temperature: 0.8 }),
      });
    });
  });
});
