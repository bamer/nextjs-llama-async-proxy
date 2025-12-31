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

// Mock modules
const websocketProvider = jest.mocked(require('@/providers/websocket-provider'));
websocketProvider.useWebSocketContext = jest.fn(() => mockWebSocketContext);

describe('useWebSocket - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketContext.isConnected = false;
  });

  it('should handle missing context gracefully', () => {
    const { result } = renderHook(() => useWebSocket());

    // Should return all methods from context
    expect(result.current).toBeDefined();
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.requestMetrics).toBe('function');
  });
});
