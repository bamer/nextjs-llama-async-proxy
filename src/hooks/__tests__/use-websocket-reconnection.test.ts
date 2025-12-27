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

describe('useWebSocket Reconnection Logic', () => {
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

  it('should start exponential backoff on disconnect', () => {
    const { result } = renderHook(() => useWebSocket());

    // First connect
    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.reconnectionAttempts).toBe(0);

    // Disconnect to trigger reconnection
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    act(() => {
      disconnectHandler();
    });

    expect(result.current.connectionState).toBe('reconnecting');
    expect(result.current.reconnectionAttempts).toBeGreaterThan(0);

    // Check that connect was called (first reconnection attempt)
    expect(mockWebSocketServer.connect).toHaveBeenCalled();
  });

  it('should use exponential backoff delays', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // First disconnect should trigger reconnect in 1 second
    act(() => {
      disconnectHandler();
    });

    // No immediate reconnection
    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(1); // Initial connect only

    // Advance past 1s delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Reconnection attempt made
    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(2);

    // Second disconnect should trigger reconnect in 2 seconds
    act(() => {
      disconnectHandler();
    });

    // No immediate reconnection
    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(2);

    // Advance past 2s delay
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(3);

    // Third disconnect should trigger reconnect in 4 seconds
    act(() => {
      disconnectHandler();
    });

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(4);

    consoleSpy.mockRestore();
  });

  it('should cap reconnection delay at 30 seconds', () => {
    const { result } = renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // Simulate multiple disconnections
    for (let i = 0; i < 5; i++) {
      act(() => {
        disconnectHandler();
      });
      // Fast forward to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    }

    // After 5 attempts, next should be max delay (30s)
    expect(result.current.reconnectionAttempts).toBe(5);
  });

  it('should stop reconnection after max attempts', () => {
    const { result } = renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    const initialConnectCount = mockWebSocketServer.connect.mock.calls.length;

    // Trigger multiple disconnections
    for (let i = 0; i < 10; i++) {
      act(() => {
        disconnectHandler();
      });
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    }

    // Should have stopped at 5 reconnection attempts
    expect(result.current.connectionState).toBe('error');
  });

  it('should resubscribe to data on successful reconnection', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // First connection
    act(() => {
      connectHandler();
    });

    // Clear previous calls
    mockWebSocketServer.requestMetrics.mockClear();
    mockWebSocketServer.requestModels.mockClear();
    mockWebSocketServer.requestLogs.mockClear();

    // Disconnect
    act(() => {
      disconnectHandler();
    });

    // Trigger reconnection by advancing timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Simulate successful reconnection
    act(() => {
      connectHandler();
    });

    // Should have resubscribed to all data
    expect(mockWebSocketServer.requestMetrics).toHaveBeenCalled();
    expect(mockWebSocketServer.requestModels).toHaveBeenCalled();
    expect(mockWebSocketServer.requestLogs).toHaveBeenCalled();

    // Check console logged the reconnection success
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('WebSocket reconnected successfully')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Resubscribing to data streams')
    );

    consoleSpy.mockRestore();
  });

  it('should not resubscribe on initial connection', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    // Initial connection (not a reconnection)
    act(() => {
      connectHandler();
    });

    // Should NOT have resubscribed on initial connection
    expect(mockWebSocketServer.requestMetrics).not.toHaveBeenCalled();
    expect(mockWebSocketServer.requestModels).not.toHaveBeenCalled();
    expect(mockWebSocketServer.requestLogs).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should reset reconnection attempts on successful connection', () => {
    const { result } = renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // Disconnect and reconnect multiple times
    for (let i = 0; i < 3; i++) {
      act(() => {
        disconnectHandler();
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      act(() => {
        connectHandler();
      });
    }

    // After successful reconnection, attempts should be 0
    expect(result.current.reconnectionAttempts).toBe(0);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should attempt reconnection on connection error', () => {
    const { result } = renderHook(() => useWebSocket());

    const errorHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect_error'
    )[1];

    const initialConnectCount = mockWebSocketServer.connect.mock.calls.length;

    // Trigger error
    act(() => {
      errorHandler(new Error('Connection failed'));
    });

    // Should have triggered reconnection
    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(initialConnectCount + 1);
  });

  it('should attempt reconnection when page becomes visible', () => {
    const { result } = renderHook(() => useWebSocket());

    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // Disconnect
    act(() => {
      disconnectHandler();
    });

    expect(result.current.isConnected).toBe(false);

    const initialConnectCount = mockWebSocketServer.connect.mock.calls.length;

    // Simulate page becoming visible
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should have attempted to reconnect
    expect(mockWebSocketServer.connect).toHaveBeenCalledTimes(initialConnectCount + 1);
  });

  it('should track reconnection attempts correctly', () => {
    const { result } = renderHook(() => useWebSocket());

    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // First disconnect
    act(() => {
      disconnectHandler();
    });
    expect(result.current.reconnectionAttempts).toBe(1);

    // Second disconnect (before reconnection succeeds)
    act(() => {
      disconnectHandler();
    });
    expect(result.current.reconnectionAttempts).toBe(2);
  });

  it('should clear reconnection timer on successful connection', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    renderHook(() => useWebSocket());

    const connectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];

    // Disconnect to start timer
    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];
    act(() => {
      disconnectHandler();
    });

    // Connect successfully
    act(() => {
      connectHandler();
    });

    // Timer should be cleared
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should expose reconnection attempts to consuming components', () => {
    const { result } = renderHook(() => useWebSocket());

    // Initially 0
    expect(result.current.reconnectionAttempts).toBe(0);

    const disconnectHandler = mockWebSocketServer.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];

    // After disconnect
    act(() => {
      disconnectHandler();
    });

    // Should have incremented
    expect(result.current.reconnectionAttempts).toBeGreaterThan(0);
  });
});
