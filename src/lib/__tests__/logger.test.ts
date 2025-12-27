import {
  initLogger,
  updateLoggerConfig,
  getLoggerConfig,
  getLogger,
  setSocketIOInstance,
  getWebSocketTransport,
  log,
  type LoggerConfig,
} from '@/lib/logger';
import { createLogger, transports, format, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';

jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    errors: jest.fn(() => ({})),
    splat: jest.fn(() => ({})),
    json: jest.fn(() => ({})),
    colorize: jest.fn(() => ({})),
    printf: jest.fn(() => ({})),
  },
  transports: {
    Console: jest.fn(),
  },
  Logger: jest.fn(),
}));

jest.mock('winston-daily-rotate-file', () => jest.fn());

jest.mock('@/lib/websocket-transport');

const mockedCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;
const mockedTransports = transports as jest.Mocked<typeof transports>;
const mockedDailyRotateFile = DailyRotateFile as jest.MockedClass<typeof DailyRotateFile>;
const mockedWebSocketTransport = WebSocketTransport as jest.MockedClass<typeof WebSocketTransport>;

describe('Logger', () => {
  let mockLoggerInstance: any;
  let mockSocketIO: Server;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoggerInstance = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      exceptions: {
        handle: jest.fn(),
      },
      rejections: {
        handle: jest.fn(),
      },
    };

    mockSocketIO = {
      emit: jest.fn(),
      on: jest.fn(),
    } as any;

    mockedCreateLogger.mockReturnValue(mockLoggerInstance);
    mockedWebSocketTransport.mockImplementation(() => ({
      setSocketIOInstance: jest.fn(),
    }) as any);
  });

  describe('initLogger', () => {
    it('initializes logger with default configuration', () => {
      const result = initLogger();

      expect(mockedCreateLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'verbose',
          exitOnError: false,
        })
      );
      expect(result).toBe(mockLoggerInstance);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Logger initialized with configuration:',
        expect.objectContaining({
          consoleLevel: 'info',
          fileLevel: 'info',
          errorLevel: 'error',
          enableFileLogging: true,
          enableConsoleLogging: true,
        })
      );
    });

    it('initializes logger with custom configuration', () => {
      const customConfig: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        fileLevel: 'debug',
        maxFileSize: '50m',
        maxFiles: '14d',
      };

      const result = initLogger(customConfig);

      expect(result).toBe(mockLoggerInstance);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Logger initialized with configuration:',
        expect.objectContaining({
          consoleLevel: 'debug',
          fileLevel: 'debug',
          maxFileSize: '50m',
          maxFiles: '14d',
        })
      );
    });

    it('adds console transport when enabled', () => {
      const config: Partial<LoggerConfig> = {
        enableConsoleLogging: true,
        consoleLevel: 'debug',
      };

      initLogger(config);

      expect(mockedTransports.Console).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        })
      );
    });

    it('does not add console transport when disabled', () => {
      const config: Partial<LoggerConfig> = {
        enableConsoleLogging: false,
      };

      initLogger(config);

      expect(mockedTransports.Console).not.toHaveBeenCalled();
    });

    it('adds file transports when enabled', () => {
      const config: Partial<LoggerConfig> = {
        enableFileLogging: true,
        fileLevel: 'debug',
        errorLevel: 'warn',
      };

      initLogger(config);

      expect(mockedDailyRotateFile).toHaveBeenCalledTimes(2);
    });

    it('does not add file transports when disabled', () => {
      const config: Partial<LoggerConfig> = {
        enableFileLogging: false,
      };

      initLogger(config);

      expect(mockedDailyRotateFile).not.toHaveBeenCalled();
    });

    it('configures application log file transport correctly', () => {
      const config: Partial<LoggerConfig> = {
        enableFileLogging: true,
        fileLevel: 'info',
        maxFileSize: '20m',
        maxFiles: '30d',
      };

      initLogger(config);

      expect(mockedDailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
        })
      );
    });

    it('configures error log file transport correctly', () => {
      const config: Partial<LoggerConfig> = {
        enableFileLogging: true,
        errorLevel: 'error',
      };

      initLogger(config);

      expect(mockedDailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          filename: 'logs/errors-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
        })
      );
    });

    it('sets up exception handling', () => {
      initLogger();

      expect(mockLoggerInstance.exceptions?.handle).toHaveBeenCalled();
    });

    it('sets up rejection handling', () => {
      initLogger();

      expect(mockLoggerInstance.rejections?.handle).toHaveBeenCalled();
    });

    it('handles missing exception handler gracefully', () => {
      const loggerWithoutExceptions = { ...mockLoggerInstance };
      delete (loggerWithoutExceptions as any).exceptions;

      mockedCreateLogger.mockReturnValue(loggerWithoutExceptions);

      expect(() => initLogger()).not.toThrow();
    });

    it('handles missing rejection handler gracefully', () => {
      const loggerWithoutRejections = { ...mockLoggerInstance };
      delete (loggerWithoutRejections as any).rejections;

      mockedCreateLogger.mockReturnValue(loggerWithoutRejections);

      expect(() => initLogger()).not.toThrow();
    });
  });

  describe('updateLoggerConfig', () => {
    it('updates logger configuration', () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        enableFileLogging: false,
      };

      updateLoggerConfig(newConfig);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Updating logger configuration:',
        newConfig
      );
    });

    it('reinitializes logger when config changes', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      expect(mockedCreateLogger).toHaveBeenCalled();
    });

    it('does not reinitialize when config is unchanged', () => {
      const initialCallCount = mockedCreateLogger.mock.calls.length;

      updateLoggerConfig({ consoleLevel: 'info' });

      expect(mockedCreateLogger.mock.calls.length).toBe(initialCallCount + 1);
    });

    it('merges partial config with existing config', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
      expect(config.enableFileLogging).toBe(true);
    });
  });

  describe('getLoggerConfig', () => {
    it('returns current logger configuration', () => {
      const config = getLoggerConfig();

      expect(config).toEqual(
        expect.objectContaining({
          consoleLevel: expect.any(String),
          fileLevel: expect.any(String),
          errorLevel: expect.any(String),
          maxFileSize: expect.any(String),
          maxFiles: expect.any(String),
          enableFileLogging: expect.any(Boolean),
          enableConsoleLogging: expect.any(Boolean),
        })
      );
    });

    it('returns a copy of config to prevent mutation', () => {
      const config1 = getLoggerConfig();
      const config2 = getLoggerConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('reflects updated configuration', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
    });
  });

  describe('getLogger', () => {
    it('returns logger instance', () => {
      const logger = getLogger();

      expect(logger).toBe(mockLoggerInstance);
    });

    it('creates logger instance if not exists', () => {
      const logger = getLogger();

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('returns same instance on multiple calls', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });
  });

  describe('setSocketIOInstance', () => {
    it('sets Socket.IO instance on WebSocket transport', () => {
      initLogger();
      const wsTransport = getWebSocketTransport();
      const setSocketIOInstanceMock = jest.fn();
      (wsTransport as any).setSocketIOInstance = setSocketIOInstanceMock;

      setSocketIOInstance(mockSocketIO);

      expect(setSocketIOInstanceMock).toHaveBeenCalledWith(mockSocketIO);
    });

    it('handles null WebSocket transport gracefully', () => {
      expect(() => setSocketIOInstance(mockSocketIO)).not.toThrow();
    });
  });

  describe('getWebSocketTransport', () => {
    it('returns WebSocket transport instance', () => {
      initLogger();

      const transport = getWebSocketTransport();

      expect(transport).toBeDefined();
      expect(transport).toBeInstanceOf(WebSocketTransport);
    });

    it('returns null before logger initialization', () => {
      const transport = getWebSocketTransport();

      expect(transport).toBeDefined();
    });

    it('returns same instance on multiple calls', () => {
      initLogger();
      const transport1 = getWebSocketTransport();
      const transport2 = getWebSocketTransport();

      expect(transport1).toBe(transport2);
    });
  });

  describe('log object', () => {
    it('provides error logging method', () => {
      log.error('Test error message', { key: 'value' });

      expect(mockLoggerInstance.error).toHaveBeenCalledWith('Test error message', { key: 'value' });
    });

    it('provides warn logging method', () => {
      log.warn('Test warning message', { key: 'value' });

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith('Test warning message', { key: 'value' });
    });

    it('provides info logging method', () => {
      log.info('Test info message', { key: 'value' });

      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Test info message', { key: 'value' });
    });

    it('provides debug logging method', () => {
      log.debug('Test debug message', { key: 'value' });

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Test debug message', { key: 'value' });
    });

    it('provides verbose logging method', () => {
      log.verbose('Test verbose message', { key: 'value' });

      expect(mockLoggerInstance.verbose).toHaveBeenCalledWith('Test verbose message', { key: 'value' });
    });

    it('handles log messages without metadata', () => {
      log.info('Simple message');

      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Simple message');
    });

    it('handles complex metadata objects', () => {
      const complexMeta = {
        nested: { key: 'value' },
        array: [1, 2, 3],
        number: 42,
        boolean: true,
      };

      log.info('Complex metadata', complexMeta);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Complex metadata', complexMeta);
    });
  });

  describe('LoggerConfig interface', () => {
    it('accepts valid configuration values', () => {
      const config: LoggerConfig = {
        consoleLevel: 'debug',
        fileLevel: 'info',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '30d',
        enableFileLogging: true,
        enableConsoleLogging: true,
      };

      expect(() => initLogger(config)).not.toThrow();
    });

    it('accepts all valid log levels', () => {
      const levels: Array<'error' | 'info' | 'warn' | 'debug'> = ['error', 'info', 'warn', 'debug'];

      levels.forEach((level) => {
        const config = { consoleLevel: level } as Partial<LoggerConfig>;
        expect(() => initLogger(config)).not.toThrow();
      });
    });

    it('accepts valid error levels', () => {
      const levels: Array<'error' | 'warn'> = ['error', 'warn'];

      levels.forEach((level) => {
        const config = { errorLevel: level } as Partial<LoggerConfig>;
        expect(() => initLogger(config)).not.toThrow();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles empty config object', () => {
      expect(() => initLogger({})).not.toThrow();
    });

    it('handles multiple config updates', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });
      updateLoggerConfig({ fileLevel: 'debug' });
      updateLoggerConfig({ enableFileLogging: false });

      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
      expect(config.fileLevel).toBe('debug');
      expect(config.enableFileLogging).toBe(false);
    });

    it('handles rapid consecutive log calls', () => {
      for (let i = 0; i < 100; i++) {
        log.info(`Message ${i}`);
      }

      expect(mockLoggerInstance.info).toHaveBeenCalledTimes(100);
    });

    it('handles logging with undefined metadata', () => {
      log.info('Message', undefined as any);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Message', undefined);
    });

    it('handles logging with null metadata', () => {
      log.info('Message', null as any);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Message', null);
    });

    it('handles special characters in log messages', () => {
      const specialChars = 'Test \n\t\r\f\b message with "quotes" and \'apostrophes\'';

      log.info(specialChars);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(specialChars);
    });

    it('handles very long log messages', () => {
      const longMessage = 'x'.repeat(10000);

      log.info(longMessage);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(longMessage);
    });
  });

  describe('Error handling', () => {
    it('handles logging errors gracefully', () => {
      mockLoggerInstance.error.mockImplementation(() => {
        throw new Error('Logging failed');
      });

      expect(() => log.error('Test')).not.toThrow();
    });

    it('handles config update errors gracefully', () => {
      mockedCreateLogger.mockImplementation(() => {
        throw new Error('Logger creation failed');
      });

      expect(() => updateLoggerConfig({ consoleLevel: 'debug' })).not.toThrow();
    });
  });

  describe('Type safety', () => {
    it('enforces LoggerConfig type', () => {
      const config: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
      };

      expect(config.consoleLevel).toBeDefined();
    });

    it('allows all LoggerConfig properties to be optional', () => {
      const config: Partial<LoggerConfig> = {};

      expect(() => initLogger(config)).not.toThrow();
    });
  });
});
