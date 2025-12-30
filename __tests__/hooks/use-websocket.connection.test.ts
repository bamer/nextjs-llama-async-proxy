import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';

// Mock dependencies
jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');
jest.mock('@/providers/websocket-provider');

const mockAddLog = jest.fn();
const mockSetMetrics = jest.fn();
const mockSetModels = jest.fn();
const mockSetLogs = jest.fn();

const mockWebSocketServer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendMessage: jest.fn(),
  requestMetrics: jest.fn(),
  requestLogs: jest.fn(),
  requestModels: jest.fn(),
  startModel: jest.fn(),
  stopModel: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getSocketId: jest.fn(() => 'socket-123'),
};

const mockStore = {
  getState: jest.fn(() => ({
    addLog: mockAddLog,
    setMetrics: mockSetMetrics,
    setModels: mockSetModels,
    setLogs: mockSetLogs,
  })),
};

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
const websocketClient = require('@/lib/websocket-client');
websocketClient.websocketServer = mockWebSocketServer;

const store = require('@/lib/store');
store.useStore = mockStore;

const websocketProvider = require('@/providers/websocket-provider');
websocketProvider.useWebSocketContext = jest.fn(() => mockWebSocketContext);

describe('useWebSocket - Connection Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAddLog.mockClear();
    mockSetMetrics.mockClear();
    mockSetModels.mockClear();
    mockSetLogs.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.socketId).toBe('socket-123');
  });

  it('should maintain socketId across re-renders', () => {
    const { result, rerender } = renderHook(() => useWebSocket());

    const initialSocketId = result.current.socketId;

    rerender();
    const afterFirstRerender = result.current.socketId;

    rerender();
    const afterSecondRerender = result.current.socketId;

    // Socket ID should remain consistent
    expect(initialSocketId).toBe(afterFirstRerender);
    expect(afterFirstRerender).toBe(afterSecondRerender);
  });

  it('should return consistent socketId from hook', () => {
    const { result } = renderHook(() => useWebSocket());

    const socketId1 = result.current.socketId;
    const socketId2 = result.current.socketId;
    const socketId3 = result.current.socketId;

    // Should always return same socketId
    expect(socketId1).toBe(socketId2);
    expect(socketId2).toBe(socketId3);
  });
});
