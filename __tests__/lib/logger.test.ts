import {
  initLogger,
  updateLoggerConfig,
  getLoggerConfig,
  getLogger,
  setSocketIOInstance,
  getWebSocketTransport,
  log
} from '@/lib/logger';
import { Server } from 'socket.io';

jest.mock('winston');
jest.mock('winston-daily-rotate-file');
jest.mock('./websocket-transport', () => ({
  WebSocketTransport: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    setSocketIOInstance: jest.fn(),
  })),
}));

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initLogger', () => {
    it('initializes with default config', () => {
      const logger = initLogger();
      expect(logger).toBeDefined();
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('info');
      expect(config.fileLevel).toBe('info');
      expect(config.enableConsoleLogging).toBe(true);
      expect(config.enableFileLogging).toBe(true);
    });

    it('merges partial config with defaults', () => {
      const logger = initLogger({ consoleLevel: 'debug' });
      expect(logger).toBeDefined();
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
      expect(config.fileLevel).toBe('info');
    });

    it('disables console logging when set', () => {
      initLogger({ enableConsoleLogging: false });
      const config = getLoggerConfig();
      expect(config.enableConsoleLogging).toBe(false);
    });

    it('disables file logging when set', () => {
      initLogger({ enableFileLogging: false });
      const config = getLoggerConfig();
      expect(config.enableFileLogging).toBe(false);
    });

    it('updates config on subsequent calls', () => {
      initLogger({ consoleLevel: 'info' });
      initLogger({ consoleLevel: 'debug' });
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
    });

    it('returns logger instance', () => {
      const logger = initLogger();
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('verbose');
    });
  });

  describe('updateLoggerConfig', () => {
    beforeEach(() => {
      initLogger();
    });

    it('updates existing config', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
    });

    it('preserves unchanged config', () => {
      const originalConfig = getLoggerConfig();
      updateLoggerConfig({ consoleLevel: 'debug' });
      const newConfig = getLoggerConfig();
      expect(newConfig.fileLevel).toBe(originalConfig.fileLevel);
    });

    it('handles multiple updates', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });
      updateLoggerConfig({ fileLevel: 'debug' });
      updateLoggerConfig({ errorLevel: 'warn' });
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
      expect(config.fileLevel).toBe('debug');
      expect(config.errorLevel).toBe('warn');
    });

    it('reinitializes logger when config changes', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation();
      updateLoggerConfig({ consoleLevel: 'debug' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not reinitialize when config is same', () => {
      const config = getLoggerConfig();
      const spy = jest.spyOn(console, 'info').mockImplementation();
      updateLoggerConfig(config);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('getLoggerConfig', () => {
    it('returns config object', () => {
      const config = getLoggerConfig();
      expect(config).toHaveProperty('consoleLevel');
      expect(config).toHaveProperty('fileLevel');
      expect(config).toHaveProperty('errorLevel');
      expect(config).toHaveProperty('maxFileSize');
      expect(config).toHaveProperty('maxFiles');
      expect(config).toHaveProperty('enableFileLogging');
      expect(config).toHaveProperty('enableConsoleLogging');
    });

    it('returns copy of config', () => {
      const config1 = getLoggerConfig();
      const config2 = getLoggerConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('contains valid log levels', () => {
      const config = getLoggerConfig();
      expect(['error', 'warn', 'info', 'debug']).toContain(config.consoleLevel);
      expect(['error', 'warn', 'info', 'debug']).toContain(config.fileLevel);
      expect(['error', 'warn']).toContain(config.errorLevel);
    });
  });

  describe('getLogger', () => {
    it('returns existing logger', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      expect(logger1).toBe(logger2);
    });

    it('initializes logger if not exists', () => {
      const logger = getLogger();
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('error');
    });

    it('returns logger with all methods', () => {
      const logger = getLogger();
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.verbose).toBe('function');
    });
  });

  describe('setSocketIOInstance', () => {
    it('sets Socket.IO instance on transport', () => {
      const mockIo = {} as Server;
      const transport = getWebSocketTransport();
      const setSpy = jest.spyOn(transport!, 'setSocketIOInstance');
      setSocketIOInstance(mockIo);
      expect(setSpy).toHaveBeenCalledWith(mockIo);
    });

    it('does not throw when transport is null', () => {
      expect(() => setSocketIOInstance({} as Server)).not.toThrow();
    });
  });

  describe('getWebSocketTransport', () => {
    it('returns transport instance', () => {
      const transport = getWebSocketTransport();
      expect(transport).toBeDefined();
    });

    it('returns same instance on multiple calls', () => {
      const transport1 = getWebSocketTransport();
      const transport2 = getWebSocketTransport();
      expect(transport1).toBe(transport2);
    });
  });

  describe('log convenience methods', () => {
    beforeEach(() => {
      initLogger();
    });

    it('has error method', () => {
      expect(typeof log.error).toBe('function');
    });

    it('has warn method', () => {
      expect(typeof log.warn).toBe('function');
    });

    it('has info method', () => {
      expect(typeof log.info).toBe('function');
    });

    it('has debug method', () => {
      expect(typeof log.debug).toBe('function');
    });

    it('has verbose method', () => {
      expect(typeof log.verbose).toBe('function');
    });
  });

  describe('LoggerConfig interface', () => {
    it('accepts valid console levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'];
      levels.forEach(level => {
        expect(() => initLogger({ consoleLevel: level as any })).not.toThrow();
      });
    });

    it('accepts valid file levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'];
      levels.forEach(level => {
        expect(() => initLogger({ fileLevel: level as any })).not.toThrow();
      });
    });

    it('accepts valid error levels', () => {
      const levels = ['error', 'warn'];
      levels.forEach(level => {
        expect(() => initLogger({ errorLevel: level as any })).not.toThrow();
      });
    });
  });
});
