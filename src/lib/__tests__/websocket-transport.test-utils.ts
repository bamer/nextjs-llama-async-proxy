import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';

jest.mock('socket.io');

export const mockedServer = {
  emit: jest.fn(),
} as unknown as jest.Mocked<Server>;

/**
 * Create a new WebSocketTransport instance with mocked server
 */
export function createTransport(): WebSocketTransport {
  return new WebSocketTransport({ io: mockedServer });
}

/**
 * Create a WebSocketTransport instance without Socket.IO
 */
export function createTransportWithoutIo(): WebSocketTransport {
  return new WebSocketTransport();
}

/**
 * Helper to add multiple logs to transport
 */
export function addLogs(transport: WebSocketTransport, count: number) {
  const logInfo = {
    timestamp: '2024-01-01T00:00:00Z',
    level: 'info',
    message: 'Test log',
  };

  for (let i = 0; i < count; i++) {
    transport.log({ ...logInfo, message: `Log ${i}` });
  }
}

/**
 * Helper to get transport's private log queue
 */
export function getLogQueue(transport: WebSocketTransport) {
  return (transport as any).logQueue;
}

/**
 * Helper to get transport's private max queue size
 */
export function getMaxQueueSize(transport: WebSocketTransport) {
  return (transport as any).maxQueueSize;
}

/**
 * Helper to get transport's private Socket.IO instance
 */
export function getTransportIo(transport: WebSocketTransport) {
  return (transport as any).io;
}
