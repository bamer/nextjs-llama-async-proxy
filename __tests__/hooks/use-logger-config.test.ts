import { useLoggerConfig } from '@/hooks/use-logger-config';
import { renderHook, act } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

interface LoggerConfig {
  consoleLevel: string;
  fileLevel: string;
  errorLevel: string;
  maxFileSize: string;
  maxFiles: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

const STORAGE_KEY = 'logger-config';

const DEFAULT_CONFIG: LoggerConfig = {
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
    fetchMock.enableMocks();
    localStorage.clear();
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'getItem');
    jest.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    fetchMock.disableMocks();
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should load default config when no saved config exists', () => {
      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
      expect(result.current.loading).toBe(false);
    });

    it('should load saved config from localStorage', () => {
      const savedConfig: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        fileLevel: 'warn',
        enableFileLogging: false,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig));

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.loggerConfig).toEqual({
        ...DEFAULT_CONFIG,
        ...savedConfig,
      });
    });

    it('should handle malformed localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json{{{');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should initialize with loading state false', () => {
      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update config in state', () => {
      const { result } = renderHook(() => useLoggerConfig());
      const newConfig = {
        consoleLevel: 'debug',
        maxFileSize: '50m',
      };

      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(result.current.loggerConfig.consoleLevel).toBe('debug');
      expect(result.current.loggerConfig.maxFileSize).toBe('50m');
    });

    it('should save updated config to localStorage', () => {
      const { result } = renderHook(() => useLoggerConfig());
      const newConfig = {
        fileLevel: 'warn',
        enableFileLogging: false,
      };

      act(() => {
        result.current.updateConfig(newConfig);
      });

      const savedData = localStorage.getItem(STORAGE_KEY);
      expect(savedData).not.toBeNull();
      const parsed = JSON.parse(savedData!);
      expect(parsed.fileLevel).toBe('warn');
      expect(parsed.enableFileLogging).toBe(false);
    });

    it('should merge new config with existing config', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        consoleLevel: 'error',
        fileLevel: 'error',
      }));
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({ consoleLevel: 'debug' });
      });

      expect(result.current.loggerConfig.consoleLevel).toBe('debug');
      expect(result.current.loggerConfig.fileLevel).toBe('error');
    });

    it('should handle localStorage save errors gracefully', () => {
      const { result } = renderHook(() => useLoggerConfig());
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      act(() => {
        result.current.updateConfig({ consoleLevel: 'debug' });
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resetConfig', () => {
    it('should reset config to defaults', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        consoleLevel: 'debug',
        enableFileLogging: false,
      }));
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.resetConfig();
      });

      expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
    });

    it('should save default config to localStorage on reset', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.resetConfig();
      });

      const savedData = localStorage.getItem(STORAGE_KEY);
      expect(savedData).not.toBeNull();
      const parsed = JSON.parse(savedData!);
      expect(parsed).toEqual(DEFAULT_CONFIG);
    });

    it('should handle errors on reset gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.resetConfig();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('applyToLogger', () => {
    it('should POST config to /api/logger/config endpoint', async () => {
      const { result } = renderHook(() => useLoggerConfig());
      const testConfig = {
        consoleLevel: 'debug',
        fileLevel: 'warn',
        enableFileLogging: false,
      };

      await act(async () => {
        await result.current.applyToLogger();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/logger/config',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testConfig),
        })
      );
    });

    it('should send current logger config', async () => {
      const { result } = renderHook(() => useLoggerConfig());
      act(() => {
        result.current.updateConfig({ consoleLevel: 'debug' });
      });

      await act(async () => {
        await result.current.applyToLogger();
      });

      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.consoleLevel).toBe('debug');
    });

    it('should handle fetch errors gracefully', async () => {
      fetchMock.mockReject(new Error('Network error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useLoggerConfig());

      await act(async () => {
        await result.current.applyToLogger();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to apply logger config to server:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should not throw on fetch errors', async () => {
      fetchMock.mockReject(new Error('Network error'));
      const { result } = renderHook(() => useLoggerConfig());

      await expect(async () => {
        await act(async () => {
          await result.current.applyToLogger();
        });
      }).not.toThrow();
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain type of loggerConfig fields', () => {
      const { result } = renderHook(() => useLoggerConfig());
      const config = result.current.loggerConfig;

      expect(typeof config.consoleLevel).toBe('string');
      expect(typeof config.fileLevel).toBe('string');
      expect(typeof config.errorLevel).toBe('string');
      expect(typeof config.maxFileSize).toBe('string');
      expect(typeof config.maxFiles).toBe('string');
      expect(typeof config.enableFileLogging).toBe('boolean');
      expect(typeof config.enableConsoleLogging).toBe('boolean');
    });

    it('should support valid console levels', () => {
      const { result } = renderHook(() => useLoggerConfig());
      const levels = ['error', 'info', 'warn', 'debug'];

      levels.forEach((level) => {
        act(() => {
          result.current.updateConfig({ consoleLevel: level });
        });
        expect(result.current.loggerConfig.consoleLevel).toBe(level);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should support update -> applyToLogger flow', async () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({
          consoleLevel: 'debug',
          fileLevel: 'verbose',
        });
      });

      await act(async () => {
        await result.current.applyToLogger();
      });

      expect(result.current.loggerConfig.consoleLevel).toBe('debug');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should support reset -> update flow', () => {
      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({ consoleLevel: 'debug' });
      });

      act(() => {
        result.current.resetConfig();
      });

      expect(result.current.loggerConfig).toEqual(DEFAULT_CONFIG);
    });

    it('should persist config across re-renders', () => {
      const { result, rerender } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({ consoleLevel: 'debug' });
      });

      rerender();

      expect(result.current.loggerConfig.consoleLevel).toBe('debug');
    });
  });
});
