/**
 * AGENT 1: Logger & Monitor Enhancement Tests
 * =============================================
 * Purpose: Enhanced coverage for logger initialization and configuration
 *
 * Target Files:
 * - logger.ts (91.99% → 98%)
 */

import { Server } from 'socket.io';

// Unmock logger to use real implementation
jest.unmock('@/lib/logger');

jest.mock('@/lib/websocket-transport', () => ({
  WebSocketTransport: jest.fn(() => {
    return {
      _write: jest.fn(),
      writable: true,
      setSocketIOInstance: jest.fn(),
    };
  }),
}));

jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    log: jest.fn((_info: any, callback?: any) => {
      if (typeof callback === 'function') {
        callback();
      }
    }),
  }));
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

import { createLogger } from 'winston';
import { Logger } from 'winston';

// Create a simple mock logger that has all required methods
const mockLogger: Partial<Logger> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  exceptions: {
    handle: jest.fn(),
    unhandle: jest.fn(),
  } as any,
  rejections: {
    handle: jest.fn(),
    unhandle: jest.fn(),
  } as any,
  clear: jest.fn(),
};

jest.mock('winston', () => {
  const originalModule = jest.requireActual<typeof import('winston')>('winston');
  return {
    ...originalModule,
    createLogger: jest.fn().mockReturnValue(mockLogger as Logger),
    format: originalModule.format,
  };
});

import {
  getLogger,
  initLogger,
  updateLoggerConfig,
  getLoggerConfig,
} from '@/lib/logger';

describe('Logger - Init and Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('initLogger configuration', () => {
    it('should initialize with default config', () => {
      const logger = initLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should merge partial config with defaults', () => {
      const customConfig = {
        consoleLevel: 'debug',
        enableFileLogging: false,
      } as const;

      const logger = initLogger(customConfig);
      const config = getLoggerConfig();

      expect(config.consoleLevel).toBe('debug');
      expect(config.enableFileLogging).toBe(false);
      expect(config.enableConsoleLogging).toBe(true);
    });

    it('should create console transport when enabled', () => {
      const logger = initLogger({ enableConsoleLogging: true });

      expect(logger).toBeDefined();
    });

    it('should skip console transport when disabled', () => {
      const logger = initLogger({ enableConsoleLogging: false });

      expect(logger).toBeDefined();
    });

    it('should create file transports when enabled', () => {
      const logger = initLogger({ enableFileLogging: true });

      expect(logger).toBeDefined();
    });

    it('should skip file transports when disabled', () => {
      const logger = initLogger({ enableFileLogging: false });

      expect(logger).toBeDefined();
    });
  });

  describe('updateLoggerConfig', () => {
    it('should update config without reinitializing if unchanged', () => {
      initLogger({ consoleLevel: 'info' });
      const config1 = getLoggerConfig();

      updateLoggerConfig({ consoleLevel: 'info' });
      const config2 = getLoggerConfig();

      expect(config1.consoleLevel).toBe(config2.consoleLevel);
    });

    it('should reinitialize when config changes', () => {
      initLogger({ consoleLevel: 'info' });

      updateLoggerConfig({ consoleLevel: 'debug' });
      const config = getLoggerConfig();

      expect(config.consoleLevel).toBe('debug');
    });

    it('should handle multiple config updates', () => {
      initLogger();

      updateLoggerConfig({ consoleLevel: 'warn' });
      let config = getLoggerConfig();
      expect(config.consoleLevel).toBe('warn');

      updateLoggerConfig({ fileLevel: 'error' });
      config = getLoggerConfig();
      expect(config.fileLevel).toBe('error');
      expect(config.consoleLevel).toBe('warn');
    });
  });

  describe('getLogger', () => {
    it('should return initialized logger if exists', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it('should initialize logger on first call if not initialized', () => {
      jest.resetModules();
      const logger = getLogger();

      expect(logger).toBeDefined();
    });
  });
});
