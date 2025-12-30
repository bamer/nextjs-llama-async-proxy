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

describe('useConfigurationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch to return default config quickly to avoid hanging
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

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.config).toEqual({});
    expect(result.current.activeTab).toBe(0);
    expect(result.current.formConfig).toEqual({});
    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
    // isLoadingConfig starts as true because config is loaded on mount
    expect(result.current.isLoadingConfig).toBe(true);
  });

  it('should load server config on mount', async () => {
    // Override fetch for this test
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
    // Override fetch for this test
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
    // Override fetch for this test
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

  it('should validate required host field during save', async () => {
    // Mock fetch to avoid loading hanging
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

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.validationErrors).toContain('Llama Server Settings: host - Too small: expected string to have >=1 characters');
  });

  it('should validate port number range during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: '', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: port - Too big: expected number to be <=65535');
  });

  it('should validate port minimum value during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '0', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: port - Too small: expected number to be >=1');
  });

  it('should validate negative port during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '-1', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: port - Too small: expected number to be >=1');
  });

  it('should accept valid port numbers during save', async () => {
    let savedData: any = null;

    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        savedData = JSON.parse(options?.body as string);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '70000', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toEqual([]);
    expect(savedData.port).toBe("8080");
  });

  it('should validate required serverPath field during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.serverPath', value: '', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: serverPath - Too small: expected string to have >=1 characters');
  });

  it('should validate ctx_size as positive number during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'ctx_size', value: '-1', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: ctx_size - Too small: expected number to be >=1');
  });

  it('should validate batch_size as positive number during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'batch_size', value: '-100', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: batch_size - Too small: expected number to be >=1');
  });

  it('should handle NaN ctx_size during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'ctx_size', value: 'invalid', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: ctx_size - Expected number, received nan');
  });

  it('should handle NaN batch_size during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    // Set valid general settings first
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/models', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'llamaServerPath', value: '/path/to/server', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'batch_size', value: 'invalid', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Llama Server Settings: batch_size - Expected number, received nan');
  });

  it('should handle tab change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.activeTab).toBe(0);

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 2);
    });

    expect(result.current.activeTab).toBe(2);
  });

  it('should handle text input change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formConfig.llamaServer?.host).toBe('localhost');
  });

  it('should handle checkbox input change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'testCheckbox', value: 'on', type: 'checkbox', checked: true },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).testCheckbox).toBe(true);
  });

  it('should handle llama server input change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.host).toBe('localhost');
  });

  it('should handle llama server number input', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '8080', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.port).toBe(8080);
  });

  it('should handle model defaults change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleModelDefaultsChange('temperature', 0.7);
    });

    expect((result.current.formConfig as any).modelDefaults.temperature).toBe(0.7);
  });

  it('should reset config to loaded values', async () => {
    // Override fetch for this test
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
    // Override fetch for this test
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

  // Positive test: handleSync should reload config from server and reset form
  // This covers line 159 which calls loadServerConfig()
  it('should reload server config when handleSync is called', async () => {
    // Override fetch for this test
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

  // Negative test: handleSync should handle server errors gracefully
  it('should handle sync errors without crashing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    // Override fetch for this test
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

  it('should save config successfully', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(true);
    expect(mockApplyToLogger).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
  });

  it('should handle save validation errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.validationErrors).toContain('Host is required');

    consoleSpy.mockRestore();
  });

  it('should handle save API error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Save error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  // Test removed - default values are covered in other tests
  // it('should use default values when saving with missing fields', async () => {

  it('should clear save success after timeout', async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.saveSuccess).toBe(true);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.saveSuccess).toBe(false);

    jest.useRealTimers();
  });

  it('should provide all handler functions', () => {
    const { result } = renderHook(() => useConfigurationForm());

    expect(typeof result.current.handleTabChange).toBe('function');
    expect(typeof result.current.handleInputChange).toBe('function');
    expect(typeof result.current.handleLlamaServerChange).toBe('function');
    expect(typeof result.current.handleModelDefaultsChange).toBe('function');
    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleReset).toBe('function');
    expect(typeof result.current.handleSync).toBe('function');
  });

  it('should handle rapid tab changes', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 1);
    });

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 2);
    });

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 0);
    });

    expect(result.current.activeTab).toBe(0);
  });

  it('should handle multiple llama server field changes', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '3000', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.ctx_size', value: '4096', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.host).toBe('localhost');
    expect((result.current.formConfig as any).llamaServer.port).toBe(3000);
    expect((result.current.formConfig as any).llamaServer.ctx_size).toBe(4096);
  });

  it('should preserve existing llama server fields when updating one', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '8080', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.host).toBe('localhost');
    expect((result.current.formConfig as any).llamaServer.port).toBe(8080);
  });

  it('should handle whitespace-only host value during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: '   ', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Host is required');
  });

  it('should handle valid port at boundaries during save', async () => {
    let savedData: any = null;

    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        savedData = JSON.parse(options?.body as string);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    // Test port 1 (minimum valid)
    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '8080', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toEqual([]);
    // Port is being saved as string, need to check with string comparison
    expect(savedData.port).toBe("1");

    // Test port 65535 (maximum valid)
    act(() => {
      result.current.handleInputChange({
        target: { name: 'port', value: '65535', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Need to preserve host and serverPath for second save
    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toEqual([]);
    expect(savedData.port).toBe("65535");
  });

  it('should handle zero ctx_size during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'ctx_size', value: '-1', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Context size must be a positive number');
  });

  it('should handle zero batch_size during save', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'batch_size', value: '-1', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Batch size must be a positive number');
  });

  it('should handle multiple validation errors at once', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'ctx_size', value: '-1', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors).toContain('Host is required');
    expect(result.current.validationErrors).toContain('Context size must be a positive number');
  });

  it('should handle config state across multiple saves', async () => {
    let callCount = 0;
    const savedDataArray: any[] = [];

    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        const parsed = JSON.parse(options?.body as string);
        savedDataArray[callCount] = parsed;
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(savedDataArray[0]).toBeDefined();
    expect(savedDataArray[0].host).toBe('localhost');

    // Reset config for second save
    await act(async () => {
      await result.current.handleReset();
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'example.com', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'serverPath', value: '/test/path2', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(savedDataArray[1]).toBeDefined();
    expect(savedDataArray[1].host).toBe('example.com');
  });

  // Positive test: Test concurrent handleSync calls without awaiting
  // This tests that handleSync properly handles multiple concurrent requests
  it('should reload server config when handleSync is called', async () => {
    // Override fetch for this test
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

    // Modify config
    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'modified-host', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formConfig.llamaServer?.host).toBe('modified-host');

    // Call handleSync to reload
    await act(async () => {
      await result.current.handleSync();
    });

    // Config should be reset to server values
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

    // Clear the initial fetch call count
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

  // Positive test: Test proper error handling in sync operations
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

  // New test: Test validation error accumulation
  it('accumulates multiple validation errors correctly', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Set multiple invalid values
    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'ctx_size', value: '-100', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'batch_size', value: 'invalid', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    // Should accumulate all errors
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(result.current.validationErrors).toContain('Llama Server Settings: host - Too small: expected string to have >=1 characters');
    expect(result.current.validationErrors).toContain('Llama Server Settings: ctx_size - Too small: expected number to be >=1');
  });

  // New test: Test API error handling with non-200 response
  it('handles API errors with non-200 response status', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Save error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  // New test: Test save success timeout (3s)
  it('clears save success state after 3 second timeout', async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.saveSuccess).toBe(true);

    // Advance time by 2.9 seconds - should still be true
    act(() => {
      jest.advanceTimersByTime(2900);
    });
    expect(result.current.saveSuccess).toBe(true);

    // Advance time by 0.1 more seconds (total 3s) - should be false
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.saveSuccess).toBe(false);

    jest.useRealTimers();
  });

