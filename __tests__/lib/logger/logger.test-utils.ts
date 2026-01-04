import winston from 'winston';
import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getLogger } from '@/lib/logger';

jest.mock('winston');
jest.mock('winston-daily-rotate-file');
jest.mock('@/lib/websocket-transport');
jest.mock('socket.io');
jest.mock('@/lib/logger/initialize', () => ({
  getLogger: jest.fn(),
  initLogger: jest.fn(),
  updateLoggerConfig: jest.fn(),
  setSocketIOInstance: jest.fn(),
  getWebSocketTransport: jest.fn(() => null),
  getLoggerConfig: jest.fn(() => ({
    consoleLevel: 'info',
    fileLevel: 'error',
  })),
}));

export const initLogger = jest.fn();
export const updateLoggerConfig = jest.fn();
export const setSocketIOInstance = jest.fn();
export const getWebSocketTransport = jest.fn(() => null);
export const getLoggerConfig = jest.fn(() => ({
  consoleLevel: 'info',
  fileLevel: 'error',
}));

export const createMockLogger = () => {
  const mockLogger = {
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

  return mockLogger;
};
