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
    expect(mockSetMetrics).not.toHaveBeenCalled();
    expect(mockSetModels).not.toHaveBeenCalled();
    expect(mockSetLogs).not.toHaveBeenCalled();
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

  it('should not create multiple connections on re-renders', () => {
    const { rerender } = renderHook(() => useWebSocket());

    const initialConnectCalls = mockWebSocketServer.connect.mock.calls.length;

    // Rerender multiple times
    rerender();
    rerender();
    rerender();

    const finalConnectCalls = mockWebSocketServer.connect.mock.calls.length;

    // Should still be 1, not 4
    expect(finalConnectCalls).toBe(initialConnectCalls);
  });

  it('should maintain event handlers across re-renders', () => {
    const { rerender, result } = renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    expect(result.current.isConnected).toBe(true);

    rerender();

    // Should still be connected after re-render
    expect(result.current.isConnected).toBe(true);
  });

  it('should handle empty message type gracefully', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const emptyTypeMessage = {
      type: '',
      data: { test: 'data' },
    };

    act(() => {
      messageHandler(emptyTypeMessage);
    });

    // Should not crash or call store methods
    expect(mockAddLog).not.toHaveBeenCalled();
    expect(mockSetMetrics).not.toHaveBeenCalled();
    expect(mockSetModels).not.toHaveBeenCalled();
    expect(mockSetLogs).not.toHaveBeenCalled();
  });

  it('should handle message with empty string type', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const emptyStringTypeMessage = {
      type: '',
      data: { test: 'data' },
    };

    act(() => {
      messageHandler(emptyStringTypeMessage);
    });

    // Should not crash
    expect(mockAddLog).not.toHaveBeenCalled();
    expect(mockSetMetrics).not.toHaveBeenCalled();
  });

  it('should handle message with null data for logs type', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const nullDataMessage = {
      type: 'logs',
      data: null,
    };

    act(() => {
      messageHandler(nullDataMessage);
    });

    // Should NOT call setLogs when data is null (falsy check in source)
    expect(mockSetLogs).not.toHaveBeenCalled();
  });

  it('should handle message with null data for metrics type', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const nullDataMessage = {
      type: 'metrics',
      data: null,
    };

    act(() => {
      messageHandler(nullDataMessage);
    });

    // Should NOT call setMetrics when data is null (falsy check in source)
    expect(mockSetMetrics).not.toHaveBeenCalled();
  });

  it('should handle message with null data for models type', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const nullDataMessage = {
      type: 'models',
      data: null,
    };

    act(() => {
      messageHandler(nullDataMessage);
    });

    // Should NOT call setModels when data is null (falsy check in source)
    expect(mockSetModels).not.toHaveBeenCalled();
  });

  it('should handle message with undefined data for log type', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const undefinedDataMessage = {
      type: 'log',
      data: undefined,
    };

    act(() => {
      messageHandler(undefinedDataMessage);
    });

    // Should not call addLog when data is undefined
    expect(mockAddLog).not.toHaveBeenCalled();
  });

  it('should handle error messages without error object', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderHook(() => useWebSocket());

    const errorHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect_error'
    )[1];

    act(() => {
      errorHandler(null);
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', null);

    consoleSpy.mockRestore();
  });

  it('should handle error messages with string error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderHook(() => useWebSocket());

    const errorHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect_error'
    )[1];

    act(() => {
      errorHandler('Connection failed string');
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', 'Connection failed string');

    consoleSpy.mockRestore();
  });

  it('should handle rapid message bursts', () => {
    const { result } = renderHook(() => useWebSocket());

    // Connect first
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    // Send many messages rapidly
    act(() => {
      for (let i = 0; i < 100; i++) {
        messageHandler({
          type: 'log',
          data: { id: i, message: `Log ${i}` },
        });
      }
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // All logs should be processed
    expect(mockAddLog).toHaveBeenCalledTimes(100);
  });

  it('should test all convenience methods with various parameters', () => {
    const { result } = renderHook(() => useWebSocket());

    // Connect first
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    // Test all methods
    act(() => {
      result.current.sendMessage('custom-event', { key: 'value' });
      result.current.requestMetrics();
      result.current.requestLogs();
      result.current.requestModels();
      result.current.startModel('model-1');
      result.current.startModel('model-2');
      result.current.stopModel('model-1');
      result.current.stopModel('model-2');
    });

    expect(mockWebSocketServer.sendMessage).toHaveBeenCalledWith('custom-event', { key: 'value' });
    expect(mockWebSocketServer.requestMetrics).toHaveBeenCalled();
    expect(mockWebSocketServer.requestLogs).toHaveBeenCalled();
    expect(mockWebSocketServer.requestModels).toHaveBeenCalled();
    expect(mockWebSocketServer.startModel).toHaveBeenCalledWith('model-1');
    expect(mockWebSocketServer.startModel).toHaveBeenCalledWith('model-2');
    expect(mockWebSocketServer.stopModel).toHaveBeenCalledWith('model-1');
    expect(mockWebSocketServer.stopModel).toHaveBeenCalledWith('model-2');
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

  it('should handle complex nested data in messages', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const complexMessage = {
      type: 'metrics',
      data: {
        cpu: {
          usage: 50,
          history: [10, 20, 30, 40, 50],
          metadata: { source: 'system', unit: '%' },
        },
        memory: {
          usage: 60,
          total: 16384,
          used: 9830,
        },
        nested: {
          level1: {
            level2: {
              level3: {
                value: 'deep',
              },
            },
          },
        },
      },
    };

    act(() => {
      messageHandler(complexMessage);
    });

    expect(mockSetMetrics).toHaveBeenCalledWith(complexMessage.data);
  });

  it('should handle arrays in message data', () => {
    renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const arrayMessage = {
      type: 'models',
      data: [
        { id: '1', name: 'Model 1' },
        { id: '2', name: 'Model 2' },
        { id: '3', name: 'Model 3' },
      ],
    };

    act(() => {
      messageHandler(arrayMessage);
    });

    expect(mockSetModels).toHaveBeenCalledWith(arrayMessage.data);
  });

  it('should not send messages when connection state changes to disconnected', () => {
    const { result } = renderHook(() => useWebSocket());

    // First connect
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    // Send message while connected
    act(() => {
      result.current.sendMessage('test', { data: 'test' });
    });

    expect(mockWebSocketServer.sendMessage).toHaveBeenCalledTimes(1);

    // Disconnect
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    act(() => {
      disconnectHandler();
    });

    // Try to send message while disconnected
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    act(() => {
      result.current.sendMessage('test2', { data: 'test2' });
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket not connected');
    expect(mockWebSocketServer.sendMessage).toHaveBeenCalledTimes(1); // Still 1, not 2

    consoleSpy.mockRestore();
  });

  it('should update connection state correctly through lifecycle', () => {
    const { result } = renderHook(() => useWebSocket());

    // Initial state
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);

    // Connect
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    expect(result.current.connectionState).toBe('connected');
    expect(result.current.isConnected).toBe(true);

    // Disconnect
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    act(() => {
      disconnectHandler();
    });

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
  });

  it('should handle log throttling reset after processing', () => {
    const { result } = renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const logMessage = {
      type: 'log',
      data: { id: 1, message: 'Test log' },
    };

    // First batch of logs
    act(() => {
      messageHandler({ ...logMessage, data: { id: 1, message: 'Log 1' } });
      messageHandler({ ...logMessage, data: { id: 2, message: 'Log 2' } });
      messageHandler({ ...logMessage, data: { id: 3, message: 'Log 3' } });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockAddLog).toHaveBeenCalledTimes(3);

    // Second batch of logs after throttle processed
    act(() => {
      messageHandler({ ...logMessage, data: { id: 4, message: 'Log 4' } });
      messageHandler({ ...logMessage, data: { id: 5, message: 'Log 5' } });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockAddLog).toHaveBeenCalledTimes(5);
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

  it('should handle processLogQueue when queue is empty', () => {
    const { unmount } = renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    const processLogQueue = jest.fn();
    // Get reference to the original processLogQueue function
    // It's defined inside the useEffect closure, so we can't directly test it
    // Instead, test that when unmount happens without logs, no error occurs
    expect(() => {
      unmount();
    }).not.toThrow();

    expect(mockAddLog).not.toHaveBeenCalled();
  });

  it('should handle processLogQueue with single log entry', () => {
    const { unmount } = renderHook(() => useWebSocket());

    const messageHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )[1];

    // Send exactly one log
    act(() => {
      messageHandler({
        type: 'log',
        data: { id: 1, message: 'Single log' },
      });
    });

    // Advance timer to trigger processLogQueue
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should process exactly one log
    expect(mockAddLog).toHaveBeenCalledTimes(1);
    expect(mockAddLog).toHaveBeenCalledWith({ id: 1, message: 'Single log' });
  });
});
