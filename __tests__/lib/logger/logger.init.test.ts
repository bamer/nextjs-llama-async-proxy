import { type LoggerConfig } from '@/lib/logger';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { createMockLogger, initLogger, updateLoggerConfig, getLoggerConfig } from './logger.test-utils';

jest.mock('winston');
jest.mock('winston-daily-rotate-file');

describe('Logger Initialization', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  it('should initialize logger with default config', () => {
    const logger = initLogger();
    expect(logger).toBe(mockLogger);
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        exitOnError: false,
      })
    );
  });

  it('should create console transport when enabled', () => {
    initLogger({ enableConsoleLogging: true });
    expect(winston.transports.Console).toHaveBeenCalledWith(
      expect.objectContaining({
        level: expect.any(String),
      })
    );
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
