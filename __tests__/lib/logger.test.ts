import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import {
  initLogger,
  updateLoggerConfig,
  getLoggerConfig,
  getLogger,
  log,
  type LoggerConfig,
} from '@/lib/logger';

jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(() => 'combined-format'),
    timestamp: jest.fn(() => 'timestamp-format'),
    errors: jest.fn(() => 'errors-format'),
    splat: jest.fn(() => 'splat-format'),
    json: jest.fn(() => 'json-format'),
    colorize: jest.fn(() => 'colorize-format'),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
  },
}));

jest.mock('winston-daily-rotate-file');

const mockCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;
const mockTransportsConsole = transports.Console as jest.MockedFunction<typeof transports.Console>;
const MockDailyRotateFile = DailyRotateFile as jest.MockedClass<typeof DailyRotateFile>;

describe('logger', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      exceptions: {
        handle: jest.fn(),
      },
      rejections: {
        handle: jest.fn(),
      },
    } as unknown as Logger;

    mockCreateLogger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initLogger', () => {
    it('should create logger with default configuration', () => {
      const logger = initLogger();

      expect(mockCreateLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          levels: {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            verbose: 4,
          },
          level: 'verbose',
          exitOnError: false,
        })
      );
      expect(logger).toBe(mockLogger);
    });

    it('should add console transport when enabled', () => {
      initLogger({ enableConsoleLogging: true });

      expect(mockTransportsConsole).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should not add console transport when disabled', () => {
      initLogger({ enableConsoleLogging: false });

      expect(mockTransportsConsole).not.toHaveBeenCalled();
    });

    it('should add file transports when enabled', () => {
      initLogger({ enableFileLogging: true });

      expect(MockDailyRotateFile).toHaveBeenCalledTimes(2);
    });

    it('should not add file transports when disabled', () => {
      initLogger({ enableFileLogging: false });

      expect(MockDailyRotateFile).not.toHaveBeenCalled();
    });

    it('should merge provided config with defaults', () => {
      const customConfig: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        fileLevel: 'warn',
        enableFileLogging: false,
      };

      initLogger(customConfig);

      expect(getLoggerConfig()).toEqual(
        expect.objectContaining({
          consoleLevel: 'debug',
          fileLevel: 'warn',
          enableFileLogging: false,
          enableConsoleLogging: true,
        })
      );
    });

    it('should setup exception handlers', () => {
      initLogger();

      expect(mockLogger.exceptions?.handle).toHaveBeenCalled();
      expect(mockLogger.rejections?.handle).toHaveBeenCalled();
    });

    it('should log initialization message', () => {
      initLogger();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Logger initialized with configuration:',
        expect.any(Object)
      );
    });
  });

  describe('updateLoggerConfig', () => {
    it('should update logger configuration', () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: 'debug',
        enableFileLogging: false,
      };

      updateLoggerConfig(newConfig);

      expect(getLoggerConfig().consoleLevel).toBe('debug');
    });

    it('should reinitialize logger when config changes', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      expect(mockCreateLogger).toHaveBeenCalledTimes(2);
    });

    it('should not reinitialize logger when config has not changed', () => {
      updateLoggerConfig({});

      expect(mockCreateLogger).toHaveBeenCalledTimes(1);
    });

    it('should log config update message', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Updating logger configuration:',
        { consoleLevel: 'debug' }
      );
    });
  });

  describe('getLoggerConfig', () => {
    it('should return current configuration', () => {
      const config = getLoggerConfig();

      expect(config).toEqual({
        consoleLevel: 'info',
        fileLevel: 'info',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '30d',
        enableFileLogging: true,
        enableConsoleLogging: true,
      });
    });

    it('should return a copy of config (not reference)', () => {
      const config1 = getLoggerConfig();
      const config2 = getLoggerConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getLogger', () => {
    it('should create new logger if not exists', () => {
      const logger = getLogger();

      expect(logger).toBe(mockLogger);
      expect(mockCreateLogger).toHaveBeenCalled();
    });

    it('should return existing logger if already initialized', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
      expect(mockCreateLogger).toHaveBeenCalledTimes(1);
    });
  });

  describe('log convenience object', () => {
    it('should provide error method', () => {
      log.error('test error', { meta: 'data' });

      expect(mockLogger.error).toHaveBeenCalledWith('test error', { meta: 'data' });
    });

    it('should provide warn method', () => {
      log.warn('test warning');

      expect(mockLogger.warn).toHaveBeenCalledWith('test warning');
    });

    it('should provide info method', () => {
      log.info('test info');

      expect(mockLogger.info).toHaveBeenCalledWith('test info');
    });

    it('should provide debug method', () => {
      log.debug('test debug');

      expect(mockLogger.debug).toHaveBeenCalledWith('test debug');
    });

    it('should provide verbose method', () => {
      log.verbose('test verbose');

      expect(mockLogger.verbose).toHaveBeenCalledWith('test verbose');
    });

    it('should handle logging without metadata', () => {
      log.info('message without metadata');

      expect(mockLogger.info).toHaveBeenCalledWith('message without metadata');
    });
  });

  describe('LoggerConfig type', () => {
    it('should define valid console levels', () => {
      const validLevels: LoggerConfig['consoleLevel'][] = ['error', 'info', 'warn', 'debug'];

      validLevels.forEach((level) => {
        expect(['error', 'info', 'warn', 'debug']).toContain(level);
      });
    });

    it('should define valid file levels', () => {
      const validLevels: LoggerConfig['fileLevel'][] = ['error', 'info', 'warn', 'debug'];

      validLevels.forEach((level) => {
        expect(['error', 'info', 'warn', 'debug']).toContain(level);
      });
    });

    it('should define valid error levels', () => {
      const validLevels: LoggerConfig['errorLevel'][] = ['error', 'warn'];

      validLevels.forEach((level) => {
        expect(['error', 'warn']).toContain(level);
      });
    });
  });
});
