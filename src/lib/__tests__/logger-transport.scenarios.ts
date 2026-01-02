/**
 * Logger Transport Test Scenarios
 * Tests for console and file transports
 */

import type { LoggerConfig } from '@/lib/logger';
import { mockedTransports, mockedDailyRotateFile, setupLoggerMocks } from './logger-mock-transport';

/**
 * Console transport tests
 */
export const consoleTransportScenarios = {
  testEnabled: () => {
    const config: Partial<LoggerConfig> = { enableConsoleLogging: true, consoleLevel: 'debug' };
    const { initLogger } = require('@/lib/logger');
    initLogger(config);
    expect(mockedTransports.Console).toHaveBeenCalledWith(expect.objectContaining({ level: 'debug' }));
  },

  testDisabled: () => {
    const config: Partial<LoggerConfig> = { enableConsoleLogging: false };
    const { initLogger } = require('@/lib/logger');
    initLogger(config);
    expect(mockedTransports.Console).not.toHaveBeenCalled();
  },
};

/**
 * File transport tests
 */
export const fileTransportScenarios = {
  testEnabled: () => {
    const config: Partial<LoggerConfig> = { enableFileLogging: true, fileLevel: 'debug', errorLevel: 'warn' };
    const { initLogger } = require('@/lib/logger');
    initLogger(config);
    expect(mockedDailyRotateFile).toHaveBeenCalledTimes(2);
  },

  testDisabled: () => {
    const config: Partial<LoggerConfig> = { enableFileLogging: false };
    const { initLogger } = require('@/lib/logger');
    initLogger(config);
    expect(mockedDailyRotateFile).not.toHaveBeenCalled();
  },

  testApplicationLogConfig: () => {
    const config: Partial<LoggerConfig> = {
      enableFileLogging: true,
      fileLevel: 'info',
      maxFileSize: '20m',
      maxFiles: '30d',
    };
    const { initLogger } = require('@/lib/logger');
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
  },

  testErrorLogConfig: () => {
    const config: Partial<LoggerConfig> = { enableFileLogging: true, errorLevel: 'error' };
    const { initLogger } = require('@/lib/logger');
    initLogger(config);
    expect(mockedDailyRotateFile).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'error', filename: 'logs/errors-%DATE%.log' })
    );
  },
};

/**
 * Exception and rejection handler tests
 */
export const handlerScenarios = {
  testExceptionHandler: () => {
    const { initLogger } = require('@/lib/logger');
    const { mockLoggerInstance } = setupLoggerMocks();
    initLogger();
    expect(mockLoggerInstance.exceptions?.handle).toHaveBeenCalled();
  },

  testRejectionHandler: () => {
    const { initLogger } = require('@/lib/logger');
    const { mockLoggerInstance } = setupLoggerMocks();
    initLogger();
    expect(mockLoggerInstance.rejections?.handle).toHaveBeenCalled();
  },

  testMissingExceptionHandler: () => {
    const { initLogger } = require('@/lib/logger');
    const logger = setupLoggerMocks().mockLoggerInstance;
    delete (logger as any).exceptions;
    const { mockedCreateLogger } = require('./logger-mock-transport');
    mockedCreateLogger.mockReturnValue(logger);
    expect(() => initLogger()).not.toThrow();
  },

  testMissingRejectionHandler: () => {
    const { initLogger } = require('@/lib/logger');
    const logger = setupLoggerMocks().mockLoggerInstance;
    delete (logger as any).rejections;
    const { mockedCreateLogger } = require('./logger-mock-transport');
    mockedCreateLogger.mockReturnValue(logger);
    expect(() => initLogger()).not.toThrow();
  },
};
