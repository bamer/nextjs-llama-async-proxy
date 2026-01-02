/**
 * Logger Mock Transport Utilities
 * Provides mock setup and utility functions for logger testing
 */

import { createLogger, transports, format, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
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
  })),
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
    Console: jest.fn(() => ({})),
  },
  Logger: jest.fn(),
}));

jest.mock('winston-daily-rotate-file', () => jest.fn());

jest.mock('@/lib/websocket-transport');

export const mockedCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;
export const mockedTransports = transports as jest.Mocked<typeof transports>;
export const mockedDailyRotateFile = DailyRotateFile as jest.MockedClass<typeof DailyRotateFile>;
export const mockedWebSocketTransport = WebSocketTransport as jest.MockedClass<typeof WebSocketTransport>;

/**
 * Creates a mock logger instance with all standard methods
 */
export function createMockLoggerInstance(): any {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    clear: jest.fn(),
    exceptions: {
      handle: jest.fn(),
    },
    rejections: {
      handle: jest.fn(),
    },
  };
}

/**
 * Creates a mock Socket.IO instance
 */
export function createMockSocketIO(): Server {
  return {
    emit: jest.fn(),
    on: jest.fn(),
  } as any;
}

/**
 * Sets up all mocks for logger testing
 */
export function setupLoggerMocks(): {
  mockLoggerInstance: any;
  mockSocketIO: Server;
} {
  const mockLoggerInstance = createMockLoggerInstance();
  const mockSocketIO = createMockSocketIO();

  mockedCreateLogger.mockReturnValue(mockLoggerInstance);
  mockedWebSocketTransport.mockImplementation(() => ({
    setSocketIOInstance: jest.fn(),
  }) as any);

  return { mockLoggerInstance, mockSocketIO };
}
