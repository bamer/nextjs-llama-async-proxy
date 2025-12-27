import { renderHook, act, waitFor } from '@testing-library/react';
import { useLoggerConfig } from '@/hooks/use-logger-config';

const STORAGE_KEY = 'logger-config';

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
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default config', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
    expect(result.current.loading).toBe(false);
  });

  it('should load saved config from localStorage on mount', () => {
    const savedConfig = {
      consoleLevel: 'debug',
      fileLevel: 'warn',
      errorLevel: 'error',
      maxFileSize: '50m',
      maxFiles: '60d',
      enableFileLogging: false,
      enableConsoleLogging: false,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig));

    const { result } = renderHook(() => useLoggerConfig());

    expect(result.current.loggerConfig).toEqual(savedConfig);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    localStorage.setItem(STORAGE_KEY, 'invalid-json{');

    const { result } = renderHook(() => useLoggerConfig());

    expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load logger config:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
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

    expect(localStorage.getItem(STORAGE_KEY)).toEqual(
      JSON.stringify({
        ...DEFAULT_CONFIG,
        consoleLevel: 'debug',
      })
    );
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

  it('should handle localStorage save errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to save logger config:',
      expect.any(Error)
    );

    setItemSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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
    expect(localStorage.getItem(STORAGE_KEY)).toEqual(
      JSON.stringify(DEFAULT_CONFIG)
    );
  });

  it('should handle localStorage reset errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.resetConfig();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to reset logger config:',
      expect.any(Error)
    );

    setItemSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should apply config to server via API', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    ) as jest.Mock;

    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    await act(async () => {
      await result.current.applyToLogger();
    });

    expect(fetch).toHaveBeenCalledWith('/api/logger/config', {
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
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

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

  it('should return all expected functions', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(typeof result.current.updateConfig).toBe('function');
    expect(typeof result.current.resetConfig).toBe('function');
    expect(typeof result.current.applyToLogger).toBe('function');
  });

  it('should not crash on updateConfig with empty object', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(() => {
      act(() => {
        result.current.updateConfig({});
      });
    }).not.toThrow();

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

  it('should toggle boolean config values', () => {
    const { result } = renderHook(() => useLoggerConfig());

    expect(result.current.loggerConfig.enableFileLogging).toBe(true);

    act(() => {
      result.current.updateConfig({ enableFileLogging: false });
    });

    expect(result.current.loggerConfig.enableFileLogging).toBe(false);

    act(() => {
      result.current.updateConfig({ enableFileLogging: true });
    });

    expect(result.current.loggerConfig.enableFileLogging).toBe(true);
  });

  it('should handle empty string config values', () => {
    const { result } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: '' });
    });

    expect(result.current.loggerConfig.consoleLevel).toBe('');
  });

  it('should persist config across hook remounts', () => {
    const { result, rerender } = renderHook(() => useLoggerConfig());

    act(() => {
      result.current.updateConfig({ consoleLevel: 'debug' });
    });

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');

    rerender();

    expect(result.current.loggerConfig.consoleLevel).toBe('debug');
  });
});
