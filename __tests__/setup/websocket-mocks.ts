/**
 * WebSocket mocks for testing
 *
 * This file provides reusable mock implementations for WebSocket-related tests.
 * It includes mocks for:
 * - useWebSocket hook
 * - WebSocketClient
 * - Socket.IO client
 */

import { EventEmitter } from 'events';

/**
 * Mock WebSocket class that simulates browser WebSocket API
 */
export class MockWebSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url = '';
  bufferedAmount = 0;
  protocol = '';

  constructor(url: string) {
    super();
    this.url = url;

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.emit('open');
    }, 0);
  }

  send(data: string) {
    // Simulate message sending
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Echo back for testing
    this.emit('message', { data });
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('close', { code, reason });
    }, 0);
  }

  addEventListener(event: string, listener: (...args: any[]) => void) {
    this.on(event, listener);
  }

  removeEventListener(event: string, listener: (...args: any[]) => void) {
    this.off(event, listener);
  }
}

/**
 * Mock Socket class for Socket.IO client
 */
export class MockSocket extends EventEmitter {
  connected = false;
  id: string | null = null;
  rooms: Set<string> = new Set();
  data: Record<string, any> = {};

  emitCalls: Array<{ event: string; args: any[] }> = [];

  connect() {
    this.connected = true;
    this.id = `socket-${Math.random().toString(36).substr(2, 9)}`;
    this.emit('connect');
    return this;
  }

  disconnect() {
    this.connected = false;
    const oldId = this.id;
    this.id = null;
    this.emit('disconnect', oldId);
    return this;
  }

  emit(event: string, ...args: any[]) {
    this.emitCalls.push({ event, args });
    // Simulate server acknowledgment for emit
    if (event === 'requestMetrics' || event === 'requestLogs' || event === 'requestModels') {
      setTimeout(() => {
        this.emit('message', { type: event, data: null });
      }, 0);
    }
    return true;
  }

  on(event: string, listener: (...args: any[]) => void) {
    super.on(event, listener);
    return this;
  }

  off(event: string, listener?: (...args: any[]) => void) {
    if (listener) {
      super.removeListener(event, listener);
    } else {
      super.removeAllListeners(event);
    }
    return this;
  }
}

/**
 * Type for useWebSocket hook return value
 */
export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: string;
  sendMessage: jest.Mock;
  requestMetrics: jest.Mock;
  requestLogs: jest.Mock;
  requestModels: jest.Mock;
  startModel: jest.Mock;
  stopModel: jest.Mock;
  socketId: string | null;
}

/**
 * Create a mock useWebSocket hook with default values
 */
export function createMockWebSocket(overrides: Partial<UseWebSocketReturn> = {}): UseWebSocketReturn {
  return {
    isConnected: true,
    connectionState: 'connected',
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestLogs: jest.fn(),
    requestModels: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    socketId: 'socket-123',
    ...overrides,
  };
}

/**
 * Type-safe wrapper for useWebSocket mock
 */
export function createMockWebSocketHook(): jest.Mock<UseWebSocketReturn, []> {
  return jest.fn<UseWebSocketReturn, []>(() => createMockWebSocket());
}

/**
 * Setup global WebSocket mocks for tests
 */
export function setupGlobalWebSocketMocks() {
  // Mock browser WebSocket API
  if (typeof (global as any).WebSocket === 'undefined') {
    (global as any).WebSocket = MockWebSocket as any;
  }

  // Mock Socket.IO client
  jest.mock('socket.io-client', () => ({
    io: jest.fn(() => new MockSocket()),
  }));
}

/**
 * Reset WebSocket mock state between tests
 */
export function resetWebSocketMocks() {
  MockWebSocket.prototype.removeAllListeners();
  MockSocket.prototype.removeAllListeners();
  MockSocket.prototype.emitCalls = [];
}
