import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
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
import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';

jest.mock('winston');
jest.mock('winston-daily-rotate-file');
jest.mock('@/lib/websocket-transport');
jest.mock('socket.io');

describe('logger', () => {
  let mockCreateLogger: jest.Mock;
  let mockConsole: jest.Mocked<winston.ConsoleTransportInstance>;
  let mockRotateFile: jest.Mock;
  let mockWebSocketTransport: jest.Mocked<WebSocketTransport>;
  let mockLogger: jest.Mocked<winston.Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWebSocketTransport = {
      log: jest.fn(),
    } as any;

    (WebSocketTransport as jest.Mock).mockReturnValue(mockWebSocketTransport);

    mockConsole = {
      on: jest.fn().mockReturnThis(),
    } as any;

    mockRotateFile = jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
    }) as any;

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
    } as any;

    mockCreateLogger = winston.createLogger as jest.Mock;
    mockCreateLogger.mockReturnValue(mockLogger);

    (winston.transports.Console as any).mockReturnValue(mockConsole);
    (DailyRotateFile as any).mockReturnValue(mockRotateFile);
  });

  describe('initLogger', () => {
    it('should initialize logger with default config', () => {
      const logger = initLogger();

      expect(logger).toBe(mockLogger);
      expect(mockCreateLogger).toHaveBeenCalledWith(
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

      expect(mockCreateLogger).toHaveBeenCalled();
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

      const createLoggerCall = mockCreateLogger.mock.calls[0][0];
      const hasConsoleTransport = createLoggerCall.transports.some(
        (t: any) => t === mockConsole
      );
      expect(hasConsoleTransport).toBe(false);
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

      const createLoggerCall = mockCreateLogger.mock.calls[0][0];
      const hasFileTransport = createLoggerCall.transports.some(
        (t: any) => t === mockRotateFile
      );
      expect(hasFileTransport).toBe(false);
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
  });

  describe('updateLoggerConfig', () => {
    beforeEach(() => {
      initLogger();
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
      const createLoggerCallsBefore = mockCreateLogger.mock.calls.length;

      updateLoggerConfig(currentConfig);

      expect(mockCreateLogger.mock.calls.length).toBe(
        createLoggerCallsBefore
      );
    });

    it('should reinitialize when config changes', () => {
      updateLoggerConfig({ consoleLevel: 'debug' });

      expect(mockCreateLogger).toHaveBeenCalled();
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
      initLogger();
      const mockIo = {} as Server;

      setSocketIOInstance(mockIo);

      expect(mockWebSocketTransport.setSocketIOInstance).toHaveBeenCalledWith(
        mockIo
      );
    });
  });

  describe('getWebSocketTransport', () => {
    it('should return WebSocket transport', () => {
      initLogger();
      const transport = getWebSocketTransport();

      expect(transport).toBe(mockWebSocketTransport);
    });

    it('should return null before initialization', () => {
      const transport = getWebSocketTransport();

      expect(transport).toBeNull();
    });
  });

  describe('log object', () => {
    beforeEach(() => {
      initLogger();
    });

    it('should have error method', () => {
      log.error('test error', { data: 123 });

      expect(mockLogger.error).toHaveBeenCalledWith('test error', { data: 123 });
    });

    it('should have warn method', () => {
      log.warn('test warning', { code: 500 });

      expect(mockLogger.warn).toHaveBeenCalledWith('test warning', { code: 500 });
    });

    it('should have info method', () => {
      log.info('test info');

      expect(mockLogger.info).toHaveBeenCalledWith('test info', undefined);
    });

    it('should have debug method', () => {
      log.debug('test debug', { debug: true });

      expect(mockLogger.debug).toHaveBeenCalledWith('test debug', {
        debug: true,
      });
    });

    it('should have verbose method', () => {
      log.verbose('test verbose');

      expect(mockLogger.verbose).toHaveBeenCalledWith('test verbose', undefined);
    });

    it('should handle calls without meta', () => {
      log.info('message');

      expect(mockLogger.info).toHaveBeenCalledWith('message', undefined);
    });
  });

  describe('configuration options', () => {
    it('should support all log levels', () => {
      const levels = ['error', 'info', 'warn', 'debug'] as const;

      levels.forEach((level) => {
        initLogger({ consoleLevel: level });

        expect(mockCreateLogger).toHaveBeenCalled();
      });
    });

    it('should support custom max file size', () => {
      initLogger({ maxFileSize: '50m' });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          maxSize: '50m',
        })
      );
    });

    it('should support custom max files', () => {
      initLogger({ maxFiles: '60d' });

      expect(DailyRotateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFiles: '60d',
        })
      );
    });
  });
});
