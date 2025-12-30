import { renderHook, act, waitFor } from '@testing-library/react';
import { useLoggerConfig } from '@/hooks/use-logger-config';

const DEFAULT_CONFIG = {
  consoleLevel: 'info',
  fileLevel: 'info',
  errorLevel: 'error',
  maxFileSize: '20m',
  maxFiles: '30d',
  enableFileLogging: true,
  enableConsoleLogging: true,
};

describe('useLoggerConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default config', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
    expect(result.current.loading).toBe(false);
  });

  it('should provide updateConfig function', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(typeof result.current.updateConfig).toBe('function');
  });

  it('should provide resetConfig function', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(typeof result.current.resetConfig).toBe('function');
  });

  it('should provide applyToLogger function', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(typeof result.current.applyToLogger).toBe('function');
  });

  it('should provide clearFieldError function', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(typeof result.current.clearFieldError).toBe('function');
  });

  it('should update config partially', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    expect(result.current.loggerConfig).toEqual({
      ...DEFAULT_CONFIG,
      consoleLevel: 'debug',
    });
  });

  it('should update multiple config values at once', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({
        consoleLevel: 'debug',
        fileLevel: 'warn',
        enableFileLogging: false,
      });
    });

    expect(result.current.loggerConfig).toEqual({
      ...DEFAULT_CONFIG,
      consoleLevel: 'debug',
      fileLevel: 'warn',
      enableFileLogging: false,
    });
  });

  it('should reset config to defaults', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({
        consoleLevel: 'debug',
        fileLevel: 'warn',
        enableFileLogging: false,
      });
    });

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');

    act(() => {
      result.current.resetConfig();
    });

    expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
  });

  it('should handle all config fields independently', () => {
    const { result } = renderHook(() => useLoggerConfig());

    const fields = [
      'consoleLevel',
      'fileLevel',
      'errorLevel',
      'maxFileSize',
      'maxFiles',
      'enableFileLogging',
      'enableConsoleLogging',
    ];

    fields.forEach((field) => {
      act(() => {
        result.current.updateConfig({ [field]: 'test' });
      });

      expect(result.current.loggerConfig[field]).toBe('test');
    });
  });

  it('should handle all consoleLevel values', () => {
    const { result } = renderHook(() => useLoggerConfig());

    const logLevels = ['debug', 'info', 'warn', 'error'] as const;

    logLevels.forEach((level) => {
      act(() => {
        result.current.updateConfig({ consoleLevel: level });
      });
      expect(result.current.loggerConfig.consoleLevel).toBe(level);
    });
  });

  it('should handle all fileLevel values', () => {
    const { result } = renderHook(() => useLoggerConfig());

    const logLevels = ['debug', 'info', 'warn', 'error'] as const;

    logLevels.forEach((level) => {
      act(() => {
        result.current.updateConfig({ fileLevel: level });
      });
      expect(result.current.loggerConfig.fileLevel).toBe(level);
    });
  });

  it('should handle all errorLevel values', () => {
    const { result } = renderHook(() => useLoggerConfig());

    const errorLevels = ['error', 'warn'] as const;

    errorLevels.forEach((level) => {
      act(() => {
        result.current.updateConfig({ errorLevel: level });
      });
      expect(result.current.loggerConfig.errorLevel).toBe(level);
    });
  });

  it('should handle boolean config values', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ enableFileLogging: false });
    });
    expect(result.current.loggerConfig.enableFileLogging).toBe(false);

    act(() => {
      result.current.updateConfig({ enableConsoleLogging: false });
    });
    expect(result.current.loggerConfig.enableConsoleLogging).toBe(false);

    act(() => {
      result.current.updateConfig({ enableFileLogging: true, enableConsoleLogging: true });
    });
    expect(result.current.loggerConfig.enableFileLogging).toBe(true);
    expect(result.current.loggerConfig.enableConsoleLogging).toBe(true);
  });

  it('should handle maxFileSize updates', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ maxFileSize: '50m' });
    });
    expect(result.current.loggerConfig.maxFileSize).toBe('50m');

    act(() => {
      result.current.updateConfig({ maxFileSize: '100m' });
    });
    expect(result.current.loggerConfig.maxFileSize).toBe('100m');
  });

  it('should handle maxFiles updates', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ maxFiles: '60d' });
    });
    expect(result.current.loggerConfig.maxFiles).toBe('60d');

    act(() => {
      result.current.updateConfig({ maxFiles: '90d' });
    });
    expect(result.current.loggerConfig.maxFiles).toBe('90d');
  });

  it('should handle empty update object', () => {
    const { result } = renderHook(() => useLoggerConfig());

    const initialConfig = { ...result.current.loggerConfig };

    act(() => {
      result.current.updateConfig({});
    });

    expect(result.current.loggerConfig).toEqual(initialConfig);
  });

  it('should handle clearFieldError', () => {
    const { result } = renderHook(() => useLoggerConfig());

    // First update with invalid config to generate errors
    act(() => {
      result.current.updateConfig({ consoleLevel: 'invalid' as any });
    });

    expect(result.current.fieldErrors).toHaveProperty('consoleLevel');

    // Clear the error
    act(() => {
      result.current.clearFieldError('consoleLevel');
    });

    expect(result.current.fieldErrors.consoleLevel).toBe('');
  });

  it('should apply config to server via API', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
    global.fetch = mockFetch;

    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    await act(async () => {
      await result.current.applyToLogger();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/logger/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...DEFAULT_CONFIG,
        consoleLevel: 'debug',
      }),
    });

    (global.fetch as jest.Mock).mockRestore();
  });

  it('should handle applyToLogger API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFetch = jest.fn(() => Promise.reject(new Error('Network error')));
    global.fetch = mockFetch;

    const { result } = renderHook(() => useLoggerConfig());

    await act(async () => {
      await result.current.applyToLogger();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to apply logger config to server:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should preserve all config values after multiple updates', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    act(() => {
      result.current.updateConfig({ fileLevel: 'warn' });
    });

    act(() => {
      result.current.updateConfig({ enableFileLogging: false });
    });

    expect(result.current.loggerConfig).toEqual({
      ...DEFAULT_CONFIG,
      consoleLevel: 'debug',
      fileLevel: 'warn',
      enableFileLogging: false,
    });
  });

  it('should return all expected properties', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(result.current).toHaveProperty('loggerConfig');
    expect(result.current).toHaveProperty('fieldErrors');
    expect(result.current).toHaveProperty('updateConfig');
    expect(result.current).toHaveProperty('resetConfig');
    expect(result.current).toHaveProperty('applyToLogger');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('clearFieldError');
  });

  it('should maintain fieldErrors state', () => {
    const { result } = renderHook(() => useLoggerConfig());

    // Initially no errors
    expect(result.current.fieldErrors).toEqual({});

    act(() => {
      result.current.updateConfig({ consoleLevel: 'invalid' as any });
    });

    // Should have errors after invalid update
    expect(Object.keys(result.current.fieldErrors).length).toBeGreaterThan(0);
  });

  it('should handle rapid config updates', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    act(() => {
      result.current.updateConfig({ fileLevel: 'warn' });
    });

    act(() => {
      result.current.updateConfig({ enableFileLogging: false });
    });

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');
    expect(result.current.loggerConfig.fileLevel).toBe('warn');
    expect(result.current.loggerConfig.enableFileLogging).toBe(false);
  });

  it('should maintain config across re-renders', () => {
    const { result, rerender } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');

    rerender();

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');
  });

  it('should preserve default values for unmodified settings', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');
    expect(result.current.loggerConfig.fileLevel).toBe('info');
    expect(result.current.loggerConfig.errorLevel).toBe('error');
    expect(result.current.loggerConfig.maxFileSize).toBe('20m');
    expect(result.current.loggerConfig.maxFiles).toBe('30d');
    expect(result.current.loggerConfig.enableFileLogging).toBe(true);
    expect(result.current.loggerConfig.enableConsoleLogging).toBe(true);
  });

  it('should work correctly with multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useLoggerConfig());
    const { result: result2 } = renderHook(() => useLoggerConfig());

    act(() => {
      result1.current.updateConfig({ consoleLevel: 'debug' });
    });

    // Each instance should be independent
    expect(result1.current.loggerConfig.consoleLevel).toBe('debug');
    expect(result2.current.loggerConfig.consoleLevel).toBe('info'); // Still default
  });

  it('should handle all config values correctly', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({
        consoleLevel: 'debug',
        fileLevel: 'warn',
        errorLevel: 'error',
        maxFileSize: '50m',
        maxFiles: '60d',
        enableFileLogging: false,
        enableConsoleLogging: false,
      });
    });

    expect(result.current.loggerConfig).toEqual({
      consoleLevel: 'debug',
      fileLevel: 'warn',
      errorLevel: 'error',
      maxFileSize: '50m',
      maxFiles: '60d',
      enableFileLogging: false,
      enableConsoleLogging: false,
    });
  });

  it('should handle validation errors for all fields', () => {
    const { result } = renderHook(() => useLoggerConfig());

    // Test invalid values for each field
    const invalidUpdates = [
      { consoleLevel: 'invalid' as any },
      { fileLevel: 'invalid' as any },
      { errorLevel: 'invalid' as any },
      { maxFileSize: '' },
      { maxFiles: '' },
    ];

    invalidUpdates.forEach((update) => {
      act(() => {
        result.current.updateConfig(update);
      });
    });

    // Should have errors for invalid values
    expect(Object.keys(result.current.fieldErrors).length).toBeGreaterThan(0);
  });
});

  describe('validateConfig error handling (lines 40-46)', () => {
    it('should handle missing consoleLevel', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          consoleLevel: undefined as any,
        });
      });

      expect(result.current.fieldErrors).toHaveProperty('consoleLevel');
      expect(result.current.fieldErrors.consoleLevel).toBeTruthy();
    });

    it('should handle missing fileLevel', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          fileLevel: undefined as any,
        });
      });

      expect(result.current.fieldErrors).toHaveProperty('fileLevel');
    });

    it('should handle missing errorLevel', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          errorLevel: undefined as any,
        });
      });

      expect(result.current.fieldErrors).toHaveProperty('errorLevel');
    });

    it('should handle missing maxFileSize', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          maxFileSize: undefined as any,
        });
      });

      expect(result.current.fieldErrors).toHaveProperty('maxFileSize');
    });

    it('should handle missing maxFiles', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          maxFiles: undefined as any,
        });
      });

      expect(result.current.fieldErrors).toHaveProperty('maxFiles');
    });

    it('should use defaults when enableFileLogging is undefined', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          enableFileLogging: undefined as any,
        });
      });

      // Should use default value of true
      expect(result.current.loggerConfig.enableFileLogging).toBe(true);
    });

    it('should use defaults when enableConsoleLogging is undefined', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          enableConsoleLogging: undefined as any,
        });
      });

      // Should use default value of true
      expect(result.current.loggerConfig.enableConsoleLogging).toBe(true);
    });

    it('should have no errors when all values are valid', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          consoleLevel: 'info',
          fileLevel: 'info',
          errorLevel: 'error',
          maxFileSize: '20m',
          maxFiles: '30d',
          enableFileLogging: true,
          enableConsoleLogging: true,
        });
      });

      expect(result.current.fieldErrors).toEqual({});
    });
  });
