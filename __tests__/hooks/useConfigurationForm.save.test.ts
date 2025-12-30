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

describe('useConfigurationForm - Save Operations', () => {
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

  it('should handle API errors with non-200 response status', async () => {
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
});
