import { renderHook } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';

// Mock dependencies
jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');
jest.mock('@/providers/websocket-provider');

const mockWebSocketContext = {
  isConnected: false,
  connectionState: 'disconnected',
  sendMessage: jest.fn(),
  requestMetrics: jest.fn(),
  requestLogs: jest.fn(),
  requestModels: jest.fn(),
  startModel: jest.fn(),
  stopModel: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  socketId: 'socket-123',
};

// Mock the modules
const websocketProvider = jest.mocked(require('@/providers/websocket-provider'));
websocketProvider.useWebSocketContext = jest.fn(() => mockWebSocketContext);

describe('useWebSocket - Event Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketContext.isConnected = false;
  });

  it('should return isConnected from context', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(false);
  });

  it('should return connectionState from context', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.connectionState).toBe('disconnected');
  });

  it('should return socketId from context', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.socketId).toBe('socket-123');
  });
});
