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

describe('useConfigurationForm - Coverage Enhancements', () => {
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

  // Test validation error accumulation
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
    expect(result.current.validationErrors).toContain('Llama Server Settings: batch_size - Expected number, received nan');
  });

  // Test API error handling with non-200 response
  it('handles API errors with non-200 response status', async () => {
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
  });

  // Test API error with 404
  it('handles API errors with 404 status', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
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
  });

  // Test save success timeout (3s)
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

  // Test multiple validation errors across different sections
  it('accumulates validation errors across all sections', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Set invalid values in all sections
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: '', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'maxConcurrentModels', value: '0', type: 'number', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(2);
    expect(result.current.validationErrors).toContain('General Settings: basePath - Too small: expected string to have >=1 characters');
    expect(result.current.validationErrors).toContain('Llama Server Settings: host - Too small: expected string to have >=1 characters');
  });

  // Test fieldErrors population
  it('populates fieldErrors correctly on validation failure', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Create validation error
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    // fieldErrors should be populated
    expect(result.current.fieldErrors).toBeDefined();
    expect(result.current.fieldErrors.general).toBeDefined();
    expect(Object.keys(result.current.fieldErrors.general)).toContain('basePath');
  });

  // Test clearing field errors on input change
  it('clears field errors when user starts typing', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Create validation error
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.fieldErrors.general.basePath).toBeDefined();

    // Clear error by changing value
    act(() => {
      result.current.handleInputChange({
        target: { name: 'basePath', value: '/valid/path', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.fieldErrors.general.basePath).toBe('');
  });

  // Test load config with malformed response
  it('handles malformed config response gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      } as Response)
    ) as jest.Mock;

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Should handle gracefully
    expect(result.current.isLoadingConfig).toBe(false);

    consoleSpy.mockRestore();
  });

  // Test save with network error
  it('handles network error during save', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url === '/api/config' && options?.method === 'POST') {
        return Promise.reject(new Error('Network connection failed'));
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
  });

  // Test llamaServer fieldErrors clearing
  it('clears llama server field errors on input change', async () => {
    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Create llama server validation error
    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: '', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.fieldErrors.llamaServer.host).toBeDefined();

    // Clear error by changing value
    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'valid-host', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.fieldErrors.llamaServer.host).toBe('');
  });
});
