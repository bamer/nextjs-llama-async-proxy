import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';

// Mock dependencies
jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');

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

// Mock the modules
const websocketClient = require('@/lib/websocket-client');
websocketClient.websocketServer = mockWebSocketServer;

const store = require('@/lib/store');
store.useStore = mockStore;

describe('useWebSocket', () => {
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

  it('should connect on mount', () => {
    renderHook(() => useWebSocket());

    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(1);
  });

  it('should set up event listeners on mount', () => {
    renderHook(() => useWebSocket());

    // Check that on() was called for all expected events
    expect(mockWebSocketServer.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockWebSocketServer.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockWebSocketServer.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockWebSocketServer.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should handle connect event', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate connect event
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    
    act(() => {
      connectHandler();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should handle disconnect event', async () => {
    const { result } = renderHook(() => useWebSocket());

    // First connect
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    
    act(() => {
      connectHandler();
    });

    // Then disconnect
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];
    
    act(() => {
      disconnectHandler();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
  });

  it('should handle error events', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderHook(() => useWebSocket());

    // Find and trigger error handler
    const errorHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect_error'
    )[1];
    
    const testError = new Error('Connection failed');
    act(() => {
      errorHandler(testError);
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', testError);
    
    consoleSpy.mockRestore();
  });

  it('should handle metrics messages', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Find message handler
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const metricsMessage = {
      type: 'metrics',
      data: { cpu: 50, memory: 60 },
    };

    act(() => {
      messageHandler(metricsMessage);
    });

    expect(mockSetMetrics).toHaveBeenCalledWith({ cpu: 50, memory: 60 });
  });

  it('should handle models messages', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Find message handler
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const modelsMessage = {
      type: 'models',
      data: [{ id: 'model1', name: 'Test Model' }],
    };

    act(() => {
      messageHandler(modelsMessage);
    });

    expect(mockSetModels).toHaveBeenCalledWith([{ id: 'model1', name: 'Test Model' }]);
  });

  it('should handle batch logs messages', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Find message handler
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const logsMessage = {
      type: 'logs',
      data: [{ id: 1, message: 'Log 1' }, { id: 2, message: 'Log 2' }],
    };

    act(() => {
      messageHandler(logsMessage);
    });

    expect(mockSetLogs).toHaveBeenCalledWith([{ id: 1, message: 'Log 1' }, { id: 2, message: 'Log 2' }]);
  });

  it('should handle individual log events with throttling', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Find message handler
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const logMessage = {
      type: 'log',
      data: { id: 1, message: 'Individual log' },
    };

    // Send multiple log messages quickly
    act(() => {
      messageHandler(logMessage);
      messageHandler(logMessage);
      messageHandler(logMessage);
    });

    // Logs should be queued but not processed immediately
    expect(mockAddLog).not.toHaveBeenCalled();

    // Advance time to trigger throttled processing
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now logs should be processed
    expect(mockAddLog).toHaveBeenCalledTimes(3);
    expect(mockAddLog).toHaveBeenCalledWith({ id: 1, message: 'Individual log' });
  });

  it('should flush log queue on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    // Find message handler and send a log
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const logMessage = {
      type: 'log',
      data: { id: 1, message: 'Test log' },
    };

    act(() => {
      messageHandler(logMessage);
    });

    // Logs should be queued
    expect(mockAddLog).not.toHaveBeenCalled();

    // Unmount should flush the queue
    unmount();

    // Flush should happen immediately on unmount
    expect(mockAddLog).toHaveBeenCalledWith({ id: 1, message: 'Test log' });
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    // Check that off() was called for all events
    expect(mockWebSocketServer.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockWebSocketServer.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockWebSocketServer.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockWebSocketServer.off).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should disconnect on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(mockWebSocketServer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should send messages when connected', () => {
    const { result } = renderHook(() => useWebSocket());

    // Connect first
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    
    act(() => {
      connectHandler();
    });

    // Now test sending messages
    act(() => {
      result.current.sendMessage('test-event', { data: 'test' });
    });

    expect(mockWebSocketServer.sendMessage).toHaveBeenCalledWith('test-event', { data: 'test' });
  });

  it('should warn when trying to send messages while disconnected', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useWebSocket());

    // Don't connect, try to send message
    act(() => {
      result.current.sendMessage('test-event', { data: 'test' });
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket not connected');
    expect(mockWebSocketServer.sendMessage).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should provide convenience methods', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.requestMetrics();
    });
    expect(mockWebSocketServer.requestMetrics).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.requestLogs();
    });
    expect(mockWebSocketServer.requestLogs).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.requestModels();
    });
    expect(mockWebSocketServer.requestModels).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.startModel('model-123');
    });
    expect(mockWebSocketServer.startModel).toHaveBeenCalledWith('model-123');

    act(() => {
      result.current.stopModel('model-123');
    });
    expect(mockWebSocketServer.stopModel).toHaveBeenCalledWith('model-123');
  });

  it('should handle invalid messages gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderHook(() => useWebSocket());

    // Find message handler
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    // Test various invalid message formats
    const invalidMessages = [
      null,
      undefined,
      'string message',
      { type: 'unknown' },
      { data: 'no type' },
    ];

    invalidMessages.forEach((message) => {
      act(() => {
        messageHandler(message);
      });
    });

    // Should not crash or call store methods
    expect(mockAddLog).not.toHaveBeenCalled();
    expect(mockSetMetrics).not.toHaveBeenCalled();
    expect(mockSetModels).not.toHaveBeenCalled();
    expect(mockSetLogs).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle messages with missing data', () => {
    renderHook(() => useWebSocket());

    // Find message handler
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    // Test messages with missing data property
    const messagesWithMissingData = [
      { type: 'metrics' }, // No data
      { type: 'models' }, // No data
      { type: 'logs' }, // No data
      { type: 'log' }, // No data
    ];

    messagesWithMissingData.forEach((message) => {
      act(() => {
        messageHandler(message);
      });
    });

    // Should not crash when data is missing
    expect(mockSetMetrics).toHaveBeenCalledWith(undefined);
    expect(mockSetModels).toHaveBeenCalledWith(undefined);
    expect(mockSetLogs).toHaveBeenCalledWith(undefined);
    expect(mockAddLog).not.toHaveBeenCalled(); // Individual logs need data
  });

  it('should clear timeout on unmount if log throttling is active', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHook(() => useWebSocket());

    // Find message handler and send a log to create a timeout
    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const logMessage = {
      type: 'log',
      data: { id: 1, message: 'Test log' },
    };

    act(() => {
      messageHandler(logMessage);
    });

    unmount();

    // clearTimeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
