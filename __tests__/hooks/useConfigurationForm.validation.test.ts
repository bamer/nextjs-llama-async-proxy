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

describe('useConfigurationForm - Validation', () => {
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

  it('should validate required host field during save', async () => {
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

  it('should accumulate multiple validation errors correctly', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

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

    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(result.current.validationErrors).toContain('Llama Server Settings: host - Too small: expected string to have >=1 characters');
    expect(result.current.validationErrors).toContain('Llama Server Settings: ctx_size - Too small: expected number to be >=1');
  });
});
