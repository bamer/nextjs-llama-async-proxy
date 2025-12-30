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

describe('useConfigurationForm - State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    useLoggerConfig.mockReturnValue({
      applyToLogger: mockApplyToLogger,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reset config to loaded values', async () => {
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

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'modified-host', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formConfig.llamaServer?.host).toBe('modified-host');

    await act(async () => {
      await result.current.handleReset();
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

  it('should sync config from server', async () => {
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

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'modified-host', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSync();
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

  it('should reload server config when handleSync is called', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response)
    ) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Modify config
    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'modified-host', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formConfig.host).toBe('modified-host');

    // Call handleSync to reload
    await act(async () => {
      await result.current.handleSync();
    });

    // Config should be reset to server values
    expect(result.current.formConfig).toEqual({
      llamaServer: DEFAULT_SERVER_CONFIG,
    });
  });

  it('should handle sync errors without crashing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    global.fetch = jest.fn(() => Promise.reject(new Error('Sync error'))) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Modify config
    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'modified-host', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Sync should handle error
    await act(async () => {
      await result.current.handleSync();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load server config:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('handles concurrent handleSync calls without awaiting', async () => {
    let fetchCount = 0;
    global.fetch = jest.fn(() => {
      fetchCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Clear initial fetch call count
    fetchCount = 0;

    // Modify config
    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'modified-host', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Make multiple concurrent sync calls without awaiting
    const sync1 = result.current.handleSync();
    const sync2 = result.current.handleSync();
    const sync3 = result.current.handleSync();

    await Promise.all([sync1, sync2, sync3]);

    // Should have made 4 fetch calls total (initial load + 3 syncs)
    expect(fetchCount).toBe(4);
  });

  it('properly handles errors in sync operations and maintains state', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // First call succeeds
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response)
      // Second call fails
      .mockRejectedValueOnce(new Error('Network error'))
      // Third call succeeds again
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // First sync should succeed
    await act(async () => {
      await result.current.handleSync();
    });

    expect(result.current.isLoadingConfig).toBe(false);

    // Second sync should handle error gracefully
    await act(async () => {
      await result.current.handleSync();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load server config:',
      expect.any(Error)
    );

    // State should still be consistent after error
    expect(result.current.isLoadingConfig).toBe(false);

    // Third sync should succeed again
    await act(async () => {
      await result.current.handleSync();
    });

    expect(result.current.isLoadingConfig).toBe(false);

    consoleSpy.mockRestore();
  });
});
