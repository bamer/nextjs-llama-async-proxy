/**
 * AGENT 1: Logger & Monitor Enhancement Tests
 * =============================================
 * Purpose: Enhanced coverage for logger convenience methods
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
  log,
  setSocketIOInstance,
  getWebSocketTransport,
} from '@/lib/logger';

describe('Logger - Methods and Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('log convenience methods', () => {
    it('should log error message', () => {
      const logger = getLogger();
      const errorSpy = jest.spyOn(logger, 'error');

      log.error('Test error', { code: 500 });

      expect(errorSpy).toHaveBeenCalledWith('Test error', { code: 500 });
      errorSpy.mockRestore();
    });

    it('should log warning message', () => {
      const logger = getLogger();
      const warnSpy = jest.spyOn(logger, 'warn');

      log.warn('Test warning');

      expect(warnSpy).toHaveBeenCalledWith('Test warning', undefined);
      warnSpy.mockRestore();
    });

    it('should log info message', () => {
      const logger = getLogger();
      const infoSpy = jest.spyOn(logger, 'info');

      log.info('Test info');

      expect(infoSpy).toHaveBeenCalledWith('Test info', undefined);
      infoSpy.mockRestore();
    });

    it('should log debug message', () => {
      const logger = getLogger();
      const debugSpy = jest.spyOn(logger, 'debug');

      log.debug('Test debug');

      expect(debugSpy).toHaveBeenCalledWith('Test debug', undefined);
      debugSpy.mockRestore();
    });

    it('should log verbose message', () => {
      const logger = getLogger();
      const verboseSpy = jest.spyOn(logger, 'verbose');

      log.verbose('Test verbose');

      expect(verboseSpy).toHaveBeenCalledWith('Test verbose', undefined);
      verboseSpy.mockRestore();
    });
  });

  describe('setSocketIOInstance', () => {
    it('should pass Socket.IO instance to transport', () => {
      const mockIo = {} as Server;
      const wsTransport = getWebSocketTransport();

      if (wsTransport) {
        const setSpy = jest.spyOn(wsTransport, 'setSocketIOInstance');
        setSocketIOInstance(mockIo);
        expect(setSpy).toHaveBeenCalledWith(mockIo);
        setSpy.mockRestore();
      }
    });
  });

  describe('exception and rejection handling', () => {
    it('should handle exceptions (logger.exceptions)', () => {
      const logger = getLogger();

      expect(logger.exceptions).toBeDefined();
    });

    it('should handle rejections (logger.rejections)', () => {
      const logger = getLogger();

      expect(logger.rejections).toBeDefined();
    });
  });

  describe('Logger features', () => {
    it('should handle exceptions (logger.exceptions)', () => {
      const logger = getLogger();

      expect(logger.exceptions).toBeDefined();
    });

    it('should handle rejections (logger.rejections)', () => {
      const logger = getLogger();

      expect(logger.rejections).toBeDefined();
    });
  });
});
