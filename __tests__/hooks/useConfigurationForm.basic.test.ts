import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfigurationForm } from '@/components/configuration/hooks/useConfigurationForm';

jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(() => ({
    applyToLogger: jest.fn(),
  })),
}));

const mockApplyToLogger = jest.fn();
const { useLoggerConfig } = require('@/hooks/use-logger-config');

const DEFAULT_SERVER_CONFIG = {
  host: '127.0.0.1',
  port: 8080,
  basePath: '/models',
  serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
};

describe('useConfigurationForm - Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response)
    ) as jest.Mock;

    useLoggerConfig.mockReturnValue({
      applyToLogger: mockApplyToLogger,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.config).toEqual({});
    expect(result.current.activeTab).toBe(0);
    expect(result.current.formConfig).toEqual({});
    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.isLoadingConfig).toBe(true);
  });

  it('should load server config on mount', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response)
    ) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.isLoadingConfig).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/config');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should set form config after successful load', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          serverConfig: DEFAULT_SERVER_CONFIG,
          appConfig: {
            logLevel: "info",
            maxConcurrentModels: 1,
            autoUpdate: false,
            notificationsEnabled: true,
          }
        }),
      } as Response)
    ) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.formConfig).toEqual({
      llamaServer: DEFAULT_SERVER_CONFIG,
      basePath: "/models",
      logLevel: "info",
      maxConcurrentModels: 1,
      autoUpdate: false,
      notificationsEnabled: true,
      llamaServerPath: "/home/bamer/llama.cpp/build/bin/llama-server",
    });
  });

  it('should handle load server config error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load server config:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle tab change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.activeTab).toBe(0);

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 2);
    });

    expect(result.current.activeTab).toBe(2);
  });
});
