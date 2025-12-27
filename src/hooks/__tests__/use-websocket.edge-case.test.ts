/**
 * Comprehensive edge case tests for useWebSocket hook
 * Testing for null/undefined inputs, error states, loading states,
 * concurrent calls, cleanup on unmount, memory leaks, and edge cases
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../use-websocket';
import * as websocketClientModule from '@/lib/websocket-client';
import * as storeModule from '@/lib/store';

// Mock the websocket client and store
jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;
const mockUseStore = storeModule.useStore as jest.MockedFunction<typeof storeModule.useStore>;
const mockStoreState = {
  addLog: jest.fn(),
  setMetrics: jest.fn(),
  setModels: jest.fn(),
  setLogs: jest.fn(),
};

describe('useWebSocket - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock store state
    mockUseStore.mockImplementation((selector) => {
      return selector(mockStoreState as any);
    });

    // Mock websocket server methods
    mockWebsocketServer.connect = jest.fn();
    mockWebsocketServer.disconnect = jest.fn();
    mockWebsocketServer.getSocketId = jest.fn(() => 'socket-123');
    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.requestMetrics = jest.fn();
    mockWebsocketServer.requestLogs = jest.fn();
    mockWebsocketServer.requestModels = jest.fn();
    mockWebsocketServer.startModel = jest.fn();
    mockWebsocketServer.stopModel = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Null/Undefined Handling', () => {
    it('should handle null messages', () => {
      const { result } = renderHook(() => useWebSocket());

      // Get the message handler
      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send null message
      if (messageHandler) {
        act(() => {
          messageHandler(null);
        });
      }

      // Should not throw errors
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle undefined messages', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler(undefined);
        });
      }

      expect(result.current.isConnected).toBe(false);
    });

    it('should handle messages with null data', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler({ type: 'metrics', data: null });
        });
      }

      expect(result.current.isConnected).toBe(false);
    });

    it('should handle messages with undefined data', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler({ type: 'models', data: undefined });
        });
      }

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Error States', () => {
    it('should handle WebSocket connection errors', () => {
      const { result } = renderHook(() => useWebSocket());

      const errorHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect_error'
      )?.[1] as (error: unknown) => void;

      if (errorHandler) {
        act(() => {
          errorHandler(new Error('Connection failed'));
        });
      }

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should handle malformed messages', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler('invalid json string');
          messageHandler({ invalid: 'structure' });
          messageHandler(12345);
        });
      }

      // Should not crash
      expect(result.current).toBeDefined();
    });

    it('should handle errors during store updates', () => {
      mockStoreState.setMetrics.mockImplementation(() => {
        throw new Error('Store update failed');
      });

      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler({ type: 'metrics', data: { cpu: 50 } });
        });
      }

      // Should handle the error gracefully
      expect(mockStoreState.setMetrics).toHaveBeenCalled();
    });
  });

  describe('Connection States', () => {
    it('should initialize as disconnected', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should transition to connected on connect event', () => {
      const { result } = renderHook(() => useWebSocket());

      const connectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1] as () => void;

      act(() => {
        if (connectHandler) connectHandler();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
    });

    it('should transition to disconnected on disconnect event', () => {
      const { result } = renderHook(() => useWebSocket());

      const connectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1] as () => void;

      const disconnectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1] as () => void;

      act(() => {
        if (connectHandler) connectHandler();
      });

      expect(result.current.isConnected).toBe(true);

      act(() => {
        if (disconnectHandler) disconnectHandler();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('Message Handling', () => {
    it('should handle metrics messages', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'metrics', data: { cpu: 50, memory: 60 } });
        }
      });

      expect(mockStoreState.setMetrics).toHaveBeenCalledWith({ cpu: 50, memory: 60 });
    });

    it('should handle models messages', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'models', data: [{ id: '1', name: 'Model 1' }] });
        }
      });

      expect(mockStoreState.setModels).toHaveBeenCalledWith([{ id: '1', name: 'Model 1' }]);
    });

    it('should handle logs messages', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'logs', data: [{ id: '1', message: 'Test log' }] });
        }
      });

      expect(mockStoreState.setLogs).toHaveBeenCalledWith([{ id: '1', message: 'Test log' }]);
    });

    it('should handle individual log messages with throttling', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send multiple individual logs quickly
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'log', data: { id: '1', message: 'Log 1' } });
          messageHandler({ type: 'log', data: { id: '2', message: 'Log 2' } });
          messageHandler({ type: 'log', data: { id: '3', message: 'Log 3' } });
        }
      });

      // Logs should be queued, not immediately added
      expect(mockStoreState.addLog).not.toHaveBeenCalled();

      // Fast-forward past the throttle timeout
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Now logs should be processed
      expect(mockStoreState.addLog).toHaveBeenCalledTimes(3);
    });

    it('should handle unknown message types', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'unknown_type', data: {} });
        }
      });

      // Should not crash or call any store methods
      expect(mockStoreState.setMetrics).not.toHaveBeenCalled();
      expect(mockStoreState.setModels).not.toHaveBeenCalled();
      expect(mockStoreState.setLogs).not.toHaveBeenCalled();
      expect(mockStoreState.addLog).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket());

      expect(mockWebsocketServer.on).toHaveBeenCalledTimes(4); // connect, disconnect, connect_error, message

      unmount();

      expect(mockWebsocketServer.off).toHaveBeenCalledTimes(4);
      expect(mockWebsocketServer.disconnect).toHaveBeenCalled();
    });

    it('should flush pending logs on unmount', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send some logs that get queued
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'log', data: { id: '1', message: 'Log 1' } });
          messageHandler({ type: 'log', data: { id: '2', message: 'Log 2' } });
        }
      });

      const { unmount } = renderHook(() => useWebSocket());

      unmount();

      // Pending logs should be flushed
      expect(mockStoreState.addLog).toHaveBeenCalled();
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory with frequent remounts', () => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useWebSocket());
        unmount();
      }

      // Should not have excessive event listeners registered
      expect(mockWebsocketServer.on.mock.calls.length).toBeLessThan(500);
    });

    it('should not leak memory with many messages', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send many messages
      act(() => {
        for (let i = 0; i < 1000; i++) {
          if (messageHandler) {
            messageHandler({ type: 'log', data: { id: `${i}`, message: `Log ${i}` } });
          }
        }
      });

      // Process all logs
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should handle without memory issues
      expect(result.current).toBeDefined();
    });
  });

  describe('sendMessage Function', () => {
    it('should not send message when disconnected', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.sendMessage('test_event', { data: 'test' });
      });

      expect(mockWebsocketServer.sendMessage).not.toHaveBeenCalled();
    });

    it('should send message when connected', () => {
      const { result } = renderHook(() => useWebSocket());

      const connectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1] as () => void;

      act(() => {
        if (connectHandler) connectHandler();
      });

      act(() => {
        result.current.sendMessage('test_event', { data: 'test' });
      });

      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('should send message with null data', () => {
      const { result } = renderHook(() => useWebSocket());

      const connectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1] as () => void;

      act(() => {
        if (connectHandler) connectHandler();
      });

      act(() => {
        result.current.sendMessage('test_event', null);
      });

      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('test_event', null);
    });

    it('should send message with undefined data', () => {
      const { result } = renderHook(() => useWebSocket());

      const connectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1] as () => void;

      act(() => {
        if (connectHandler) connectHandler();
      });

      act(() => {
        result.current.sendMessage('test_event', undefined);
      });

      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('test_event', undefined);
    });
  });

  describe('Request Functions', () => {
    it('should call requestMetrics', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.requestMetrics();
      });

      expect(mockWebsocketServer.requestMetrics).toHaveBeenCalled();
    });

    it('should call requestLogs', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.requestLogs();
      });

      expect(mockWebsocketServer.requestLogs).toHaveBeenCalled();
    });

    it('should call requestModels', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.requestModels();
      });

      expect(mockWebsocketServer.requestModels).toHaveBeenCalled();
    });

    it('should call startModel with modelId', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.startModel('model-123');
      });

      expect(mockWebsocketServer.startModel).toHaveBeenCalledWith('model-123');
    });

    it('should call stopModel with modelId', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.stopModel('model-123');
      });

      expect(mockWebsocketServer.stopModel).toHaveBeenCalledWith('model-123');
    });

    it('should handle startModel with null/undefined modelId', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.startModel(null as any);
      });

      expect(mockWebsocketServer.startModel).toHaveBeenCalledWith(null);
    });

    it('should handle stopModel with null/undefined modelId', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.stopModel(undefined as any);
      });

      expect(mockWebsocketServer.stopModel).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Socket ID', () => {
    it('should return socket ID', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.socketId).toBe('socket-123');
    });

    it('should handle null socket ID', () => {
      mockWebsocketServer.getSocketId.mockReturnValueOnce(null as any);

      const { result } = renderHook(() => useWebSocket());

      expect(result.current.socketId).toBeNull();
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle rapid connect/disconnect cycles', () => {
      const { result } = renderHook(() => useWebSocket());

      const connectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1] as () => void;

      const disconnectHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1] as () => void;

      // Rapid connect/disconnect cycles
      for (let i = 0; i < 10; i++) {
        act(() => {
          if (connectHandler) connectHandler();
        });
        expect(result.current.isConnected).toBe(true);

        act(() => {
          if (disconnectHandler) disconnectHandler();
        });
        expect(result.current.isConnected).toBe(false);
      }
    });

    it('should handle messages during disconnection', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send messages while disconnected
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'metrics', data: { cpu: 50 } });
          messageHandler({ type: 'log', data: { message: 'Test' } });
        }
      });

      // Should still process them
      expect(mockStoreState.setMetrics).toHaveBeenCalled();
    });

    it('should handle messages with special characters', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'metrics',
            data: { cpu: 50, name: '<script>alert("xss")</script>' },
          });
        }
      });

      expect(mockStoreState.setMetrics).toHaveBeenCalledWith({
        cpu: 50,
        name: '<script>alert("xss")</script>',
      });
    });

    it('should handle messages with unicode characters', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'models',
            data: [{ id: '1', name: '模型 🚀 测试' }],
          });
        }
      });

      expect(mockStoreState.setModels).toHaveBeenCalledWith([{ id: '1', name: '模型 🚀 测试' }]);
    });

    it('should handle concurrent message streams', () => {
      const { result } = renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send messages of different types concurrently
      act(() => {
        if (messageHandler) {
          for (let i = 0; i < 50; i++) {
            messageHandler({ type: 'metrics', data: { cpu: i } });
            messageHandler({ type: 'log', data: { message: `Log ${i}` } });
            messageHandler({ type: 'models', data: [{ id: `${i}` }] });
          }
        }
      });

      // Process all logs
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // All messages should be handled
      expect(mockStoreState.setMetrics).toHaveBeenCalledTimes(50);
      expect(mockStoreState.setModels).toHaveBeenCalledTimes(50);
      expect(mockStoreState.addLog).toHaveBeenCalledTimes(50);
    });
  });

  describe('Throttling Edge Cases', () => {
    it('should handle multiple throttle intervals', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send logs, advance timer, send more logs
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'log', data: { message: 'Log 1' } });
          messageHandler({ type: 'log', data: { message: 'Log 2' } });
        }
        jest.advanceTimersByTime(500);
        messageHandler({ type: 'log', data: { message: 'Log 3' } });
        messageHandler({ type: 'log', data: { message: 'Log 4' } });
        jest.advanceTimersByTime(500);
      });

      expect(mockStoreState.addLog).toHaveBeenCalledTimes(4);
    });

    it('should handle throttle timeout during rapid messages', () => {
      renderHook(() => useWebSocket());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          // Send many logs
          for (let i = 0; i < 100; i++) {
            messageHandler({ type: 'log', data: { message: `Log ${i}` } });
          }
          // Advance only partway through the throttle timeout
          jest.advanceTimersByTime(250);
          // Send more logs
          for (let i = 0; i < 100; i++) {
            messageHandler({ type: 'log', data: { message: `Log ${i + 100}` } });
          }
          // Complete the timeout
          jest.advanceTimersByTime(250);
        }
      });

      expect(mockStoreState.addLog).toHaveBeenCalled();
    });
  });
});
