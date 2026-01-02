import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';

// Mock dependencies
jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');
jest.mock('@/providers/websocket-provider');

export const mockAddLog = jest.fn();
export const mockSetMetrics = jest.fn();
export const mockSetModels = jest.fn();
export const mockSetLogs = jest.fn();

// Track handler callbacks
let handleConnect: ((...args: any[]) => void) | null = null;
let handleDisconnect: ((...args: any[]) => void) | null = null;
let handleError: ((...args: any[]) => void) | null = null;

// Reactive context state
export const contextState = {
  isConnected: false,
  connectionState: 'disconnected' as string,
  reconnectionAttempts: 0,
};

export const mockWebSocketServer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendMessage: jest.fn(),
  requestMetrics: jest.fn(),
  requestLogs: jest.fn(),
  requestModels: jest.fn(),
  startModel: jest.fn(),
  stopModel: jest.fn(),
  on: jest.fn((event: string, callback: (...args: any[]) => void) => {
    if (event === 'connect') handleConnect = callback;
    if (event === 'disconnect') handleDisconnect = callback;
    if (event === 'connect_error') handleError = callback;
  }),
  off: jest.fn(),
  getSocketId: jest.fn(() => 'socket-123'),
};

export const mockStore = {
  getState: jest.fn(() => ({
    addLog: mockAddLog,
    setMetrics: mockSetMetrics,
    setModels: mockSetModels,
    setLogs: mockSetLogs,
  })),
};

// Mock modules
const websocketClient = require('@/lib/websocket-client');
websocketClient.websocketServer = mockWebSocketServer;

const store = require('@/lib/store');
store.useStore = mockStore;

// Make useWebSocketContext return fresh context each call
const websocketProvider = require('@/providers/websocket-provider');
websocketProvider.useWebSocketContext = jest.fn(() => ({
  isConnected: contextState.isConnected,
  connectionState: contextState.connectionState,
  reconnectionAttempts: contextState.reconnectionAttempts,
  sendMessage: mockWebSocketServer.sendMessage,
  requestMetrics: mockWebSocketServer.requestMetrics,
  requestLogs: mockWebSocketServer.requestLogs,
  requestModels: mockWebSocketServer.requestModels,
  startModel: mockWebSocketServer.startModel,
  stopModel: mockWebSocketServer.stopModel,
  on: mockWebSocketServer.on,
  off: mockWebSocketServer.off,
  socketId: mockWebSocketServer.getSocketId(),
}));

// Helper to simulate provider behavior
export function simulateProviderConnect() {
  if (handleConnect) {
    contextState.isConnected = true;
    contextState.connectionState = 'connected';
    contextState.reconnectionAttempts = 0;
    handleConnect();
  }
}

export function simulateProviderDisconnect() {
  if (handleDisconnect) {
    contextState.isConnected = false;
    contextState.connectionState = 'reconnecting';
    contextState.reconnectionAttempts += 1;
    handleDisconnect();
  }
}

export function simulateProviderError(error: Error) {
  if (handleError) {
    contextState.connectionState = 'error';
    handleError(error);
  }
}

// Helper to get handlers from mockWebSocketServer.on calls
export const getConnectHandler = () => handleConnect;

export const getDisconnectHandler = () => handleDisconnect;

export const getErrorHandler = () => handleError;
