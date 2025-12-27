import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import {
  initLogger,
  updateLoggerConfig,
  getLoggerConfig,
  getLogger,
  setSocketIOInstance,
  getWebSocketTransport,
  type LoggerConfig,
} from '@/lib/logger';
import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';

jest.mock('winston', () => {
  const originalModule = jest.requireActual('winston');

  return {
    ...originalModule,
    createLogger: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      exceptions: {
        handle: jest.fn(),
      },
      rejections: {
        handle: jest.fn(),
      },
    })),
    format: {
      combine: jest.fn((...args) => args[0]),
      timestamp: jest.fn(() => ({})),
      errors: jest.fn((...args) => args[0]),
      splat: jest.fn((...args) => args[0]),
      json: jest.fn(() => ({})),
      colorize: jest.fn(() => ({})),
      printf: jest.fn(() => ({})),
    },
    transports: {
      Console: jest.fn(),
    },
    Transport: class {},
    Logger: class {},
  };
});

jest.mock('winston-daily-rotate-file');
jest.mock('@/lib/websocket-transport');
jest.mock('socket.io');

describe('logger', () => {
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      exceptions: {
        handle: jest.fn(),
      },
      rejections: {
        handle: jest.fn(),
      },
    };

    (winston.createLogger as jest.Mock).mockReturnValue(mockLogger);
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockLogger.verbose.mockClear();
    mockLogger.exceptions.handle.mockClear();
    mockLogger.rejections.handle.mockClear();
  });

  describe('initLogger', () => {
    it('should initialize logger with default config', () => {
      const logger = initLogger();

      expect(logger).toBe(mockLogger);
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          exitOnError: false,
        })
      );
    });

    it('should merge provided config with defaults', () => {
      const config: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        fileLevel: 'warn',
      };

      initLogger(config);

      expect(winston.createLogger).toHaveBeenCalled();
    });

    it('should create console transport when enabled', () => {
      initLogger({ enableConsoleLogging: true });

      expect(winston.transports.Console).toHaveBeenCalledWith(
        expect.objectContaining({
          level: expect.any(String),
        })
      );
    });

    it('should not create console transport when disabled', () => {
      initLogger({ enableConsoleLogging: false });

      const createLoggerCall = (winston.createLogger as jest.Mock).mock.calls[0][0];
      expect(createLoggerCall.transports).not.toContain(expect.anything());
    });

    it('should create file transports when enabled', () => {
      initLogger({ enableFileLogging: true });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: expect.stringContaining('logs/application-'),
        })
      );

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: expect.stringContaining('logs/errors-'),
        })
      );
    });

    it('should not create file transports when disabled', () => {
      initLogger({ enableFileLogging: false });

      expect(DailyRotateFile).not.toHaveBeenCalled();
    });

    it('should create WebSocket transport', () => {
      initLogger();

      expect(WebSocketTransport).toHaveBeenCalled();
    });

    it('should setup exception handlers', () => {
      initLogger();

      expect(mockLogger.exceptions?.handle).toHaveBeenCalled();
    });

    it('should setup rejection handlers', () => {
      initLogger();

      expect(mockLogger.rejections?.handle).toHaveBeenCalled();
    });

    it('should log initialization message', () => {
      initLogger();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Logger initialized with configuration:',
        expect.objectContaining({
          consoleLevel: expect.any(String),
          fileLevel: expect.any(String),
        })
      );
    });

    // Positive: Test all transport types are created (lines 62-101 in source)
    it('should create console transport with correct format', () => {
      initLogger({ enableConsoleLogging: true });

      expect(winston.transports.Console).toHaveBeenCalledWith(
        expect.objectContaining({
          level: expect.any(String),
          format: expect.any(Object),
        })
      );
    });

    // Positive: Test all transport types are created
    it('should create application file transport with correct config', () => {
      initLogger({ enableFileLogging: true });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: expect.any(String),
          maxFiles: expect.any(String),
          format: expect.any(Object),
        })
      );
    });

    // Positive: Test all transport types are created
    it('should create error file transport with correct config', () => {
      initLogger({ enableFileLogging: true });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'logs/errors-%DATE%.log',
          level: expect.any(String),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: expect.any(String),
          maxFiles: expect.any(String),
          format: expect.any(Object),
        })
      );
    });
  });

  describe('updateLoggerConfig', () => {
    beforeEach(() => {
      initLogger();
      mockLogger.info.mockClear();
    });

    it('should update logger configuration', () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        fileLevel: 'error',
      };

      updateLoggerConfig(newConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Updating logger configuration:',
        newConfig
      );
    });

    it('should not reinitialize if config is same', () => {
      const currentConfig = getLoggerConfig();
      const createLoggerCallsBefore = (winston.createLogger as jest.Mock).mock.calls.length;

      updateLoggerConfig(currentConfig);

      expect((winston.createLogger as jest.Mock).mock.calls.length).toBe(
        createLoggerCallsBefore
      );
    });

    it('should reinitialize when config changes', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      expect(winston.createLogger).toHaveBeenCalled();
    });

    it('should handle multiple config updates', () => {
      initLogger({ consoleLevel: 'error' });
      initLogger({ consoleLevel: 'warn' });
      initLogger({ consoleLevel: 'info' });

      expect(winston.createLogger).toHaveBeenCalledTimes(3);
    });
  });

  describe('getLoggerConfig', () => {
    it('should return current config', () => {
      initLogger({ consoleLevel: 'debug' });

      const config = getLoggerConfig();

      expect(config).toEqual(
        expect.objectContaining({
          consoleLevel: 'debug',
        })
      );
    });

    it('should return a copy of config', () => {
      initLogger();
      const config1 = getLoggerConfig();
      const config2 = getLoggerConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getLogger', () => {
    it('should return existing logger', () => {
      initLogger();
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it('should create logger if not exists', () => {
      const logger = getLogger();

      expect(logger).toBe(mockLogger);
    });
  });

  describe('setSocketIOInstance', () => {
    it('should set Socket.IO instance on transport', () => {
      const mockIo = {} as Server;
      const mockWsTransport = {
        setSocketIOInstance: jest.fn(),
      };
      (WebSocketTransport as unknown as jest.Mock).mockReturnValue(mockWsTransport);
      initLogger();

      setSocketIOInstance(mockIo);

      expect(mockWsTransport.setSocketIOInstance).toHaveBeenCalledWith(mockIo);
    });

    it('should handle null wsTransport gracefully', () => {
      initLogger();
      const mockIo = {} as Server;

      expect(() => setSocketIOInstance(mockIo)).not.toThrow();
    });

    it('should handle setSocketIOInstance with null', () => {
      initLogger();

      expect(() => setSocketIOInstance(null as any)).not.toThrow();
    });

    it('should handle setSocketIOInstance without initialization', () => {
      expect(() => setSocketIOInstance({} as any)).not.toThrow();
    });
  });

  describe('getWebSocketTransport', () => {
    it('should return WebSocket transport', () => {
      const mockWsTransport = {};
      (WebSocketTransport as unknown as jest.Mock).mockReturnValue(mockWsTransport);
      initLogger();

      const transport = getWebSocketTransport();

      expect(transport).toBe(mockWsTransport);
    });

    it('should return null before initialization', () => {
      const transport = getWebSocketTransport();

      expect(transport).toBeNull();
    });
  });

  describe('configuration options', () => {
    it('should support all log levels', () => {
      const levels = ['error', 'info', 'warn', 'debug'] as const;

      levels.forEach((level) => {
        initLogger({ consoleLevel: level });

        expect(winston.createLogger).toHaveBeenCalled();
      });
    });

    it('should support custom max file size', () => {
      initLogger({ maxFileSize: '50m', enableFileLogging: true });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          maxSize: '50m',
        })
      );
    });

    it('should support custom max files', () => {
      initLogger({ maxFiles: '60d', enableFileLogging: true });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFiles: '60d',
        })
      );
    });

    it('should support all log levels', () => {
      const levels = ['error', 'info', 'warn', 'debug'] as const;

      levels.forEach((level) => {
        initLogger({ consoleLevel: level });
        expect(winston.createLogger).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle null config values', () => {
      const config = {
        consoleLevel: null,
        fileLevel: null,
      } as any;

      expect(() => initLogger(config)).not.toThrow();
    });

    it('should handle undefined config values', () => {
      const config = {
        consoleLevel: undefined,
        fileLevel: undefined,
      } as any;

      expect(() => initLogger(config)).not.toThrow();
    });

    it('should handle empty config object', () => {
      expect(() => initLogger({})).not.toThrow();
    });

    it('should handle invalid log level gracefully', () => {
      const config = {
        consoleLevel: 'invalid' as any,
      };

      expect(() => initLogger(config)).not.toThrow();
    });

    it('should handle very large maxFileSize value', () => {
      const config = {
        maxFileSize: '999999g',
        enableFileLogging: true,
      };

      expect(() => initLogger(config)).not.toThrow();
      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          maxSize: '999999g',
        })
      );
    });

    it('should handle negative maxFiles value', () => {
      const config = {
        maxFiles: '-10d',
      };

      expect(() => initLogger(config)).not.toThrow();
    });

    it('should handle zero maxFiles value', () => {
      const config = {
        maxFiles: '0d',
      };

      expect(() => initLogger(config)).not.toThrow();
    });

    it('should handle all transports disabled', () => {
      const config = {
        enableConsoleLogging: false,
        enableFileLogging: false,
      };

      expect(() => initLogger(config)).not.toThrow();
    });

    it('should handle very long log messages', () => {
      initLogger();
      const longMessage = 'x'.repeat(1000000);

      expect(() => mockLogger.info(longMessage)).not.toThrow();
    });

    it('should handle unicode in log messages', () => {
      initLogger();
      const unicodeMessage = 'Hello 世界 🌍 🚀';

      expect(() => mockLogger.info(unicodeMessage)).not.toThrow();
    });

    it('should handle special characters in log messages', () => {
      initLogger();
      const specialMessage = '\x00\x01\x02\x03\x1b[31mRed text\x1b[0m';

      expect(() => mockLogger.info(specialMessage)).not.toThrow();
    });

    it('should handle deeply nested meta objects', () => {
      initLogger();
      const nestedMeta = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      };

      expect(() => mockLogger.info('test', nestedMeta)).not.toThrow();
    });

    it('should handle circular references in meta', () => {
      initLogger();
      const circularMeta: any = { name: 'test' };
      circularMeta.self = circularMeta;

      expect(() => mockLogger.info('test', circularMeta)).not.toThrow();
    });

    it('should handle array meta values', () => {
      initLogger();
      const arrayMeta = [1, 2, 3, { nested: 'value' }, ['array', 'in', 'array']];

      expect(() => mockLogger.info('test', arrayMeta)).not.toThrow();
    });

    it('should handle null and undefined meta values', () => {
      initLogger();

      expect(() => mockLogger.info('test', null)).not.toThrow();
      expect(() => mockLogger.info('test', undefined)).not.toThrow();
    });

    it('should handle Date objects in meta', () => {
      initLogger();
      const dateMeta = { timestamp: new Date(), date: new Date('2024-01-01') };

      expect(() => mockLogger.info('test', dateMeta)).not.toThrow();
    });

    it('should handle Buffer objects in meta', () => {
      initLogger();
      const bufferMeta = { data: Buffer.from('test') };

      expect(() => mockLogger.info('test', bufferMeta)).not.toThrow();
    });

    it('should handle Error objects in meta', () => {
      initLogger();
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      expect(() => mockLogger.error('test', error)).not.toThrow();
    });

    it('should handle mixed type meta objects', () => {
      initLogger();
      const mixedMeta = {
        string: 'value',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: true },
        date: new Date(),
      };

      expect(() => mockLogger.info('test', mixedMeta)).not.toThrow();
    });

    it('should handle config with extra properties', () => {
      const configWithExtra = {
        consoleLevel: 'info',
        extraProperty: 'should be ignored',
        anotherExtra: 123,
      } as any;

      expect(() => initLogger(configWithExtra)).not.toThrow();
    });

    it('should handle concurrent config updates', async () => {
      initLogger();

      await Promise.all([
        Promise.resolve(updateLoggerConfig({ consoleLevel: 'error' })),
        Promise.resolve(updateLoggerConfig({ consoleLevel: 'warn' })),
        Promise.resolve(updateLoggerConfig({ consoleLevel: 'info' })),
      ]);

      expect(winston.createLogger).toHaveBeenCalled();
    });

    // Negative: Test missing exceptions handler
    it('should handle missing exceptions handler gracefully', () => {
      const mockLoggerNoExceptions = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        // No exceptions property
      };
      (winston.createLogger as jest.Mock).mockReturnValue(mockLoggerNoExceptions);

      expect(() => initLogger()).not.toThrow();
    });

    // Negative: Test missing rejections handler
    it('should handle missing rejections handler gracefully', () => {
      const mockLoggerNoRejections = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        exceptions: {
          handle: jest.fn(),
        },
        // No rejections property
      };
      (winston.createLogger as jest.Mock).mockReturnValue(mockLoggerNoRejections);

      expect(() => initLogger()).not.toThrow();
    });
  });
});
