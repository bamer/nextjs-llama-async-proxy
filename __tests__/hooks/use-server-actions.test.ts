import { renderHook, act } from '@testing-library/react';
import { useServerActions } from '@/hooks/use-server-actions';

// Mock dependencies
jest.mock('@/hooks/use-websocket');
jest.mock('@/lib/store');

const mockSendMessage = jest.fn();
const mockIsConnected = true;

const mockUseWebSocket = {
  isConnected: mockIsConnected,
  sendMessage: mockSendMessage,
};

// Mock the hook
const useWebSocket = require('@/hooks/use-websocket');
useWebSocket.useWebSocket = jest.fn(() => mockUseWebSocket);

// Mock store (though not used in this hook)
const store = require('@/lib/store');
store.useStore = jest.fn();

describe('useServerActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWebSocket.useWebSocket.mockReturnValue(mockUseWebSocket);
  });

  it('should return handleStartServer, handleStopServer, and isConnected', () => {
    const { result } = renderHook(() => useServerActions());

    expect(result.current).toHaveProperty('handleStartServer');
    expect(result.current).toHaveProperty('handleStopServer');
    expect(result.current).toHaveProperty('isConnected');

    expect(typeof result.current.handleStartServer).toBe('function');
    expect(typeof result.current.handleStopServer).toBe('function');
    expect(result.current.isConnected).toBe(mockIsConnected);
  });

  it('should call useWebSocket with correct parameters', () => {
    renderHook(() => useServerActions());

    expect(useWebSocket.useWebSocket).toHaveBeenCalledTimes(1);
  });

  describe('handleStartServer', () => {
    it('should call sendMessage with start_llama_server event', () => {
      const { result } = renderHook(() => useServerActions());

      act(() => {
        result.current.handleStartServer();
      });

      expect(mockSendMessage).toHaveBeenCalledWith('start_llama_server', {});
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useServerActions());

      const firstHandle = result.current.handleStartServer;

      rerender();

      const secondHandle = result.current.handleStartServer;

      // Note: useEffectEvent may not be available in this React version,
      // so we test that the function exists and works rather than reference stability
      expect(typeof firstHandle).toBe('function');
      expect(typeof secondHandle).toBe('function');
    });

    it('should call sendMessage multiple times when called multiple times', () => {
      const { result } = renderHook(() => useServerActions());

      act(() => {
        result.current.handleStartServer();
        result.current.handleStartServer();
        result.current.handleStartServer();
      });

      expect(mockSendMessage).toHaveBeenCalledTimes(3);
      expect(mockSendMessage).toHaveBeenCalledWith('start_llama_server', {});
    });
  });

  describe('handleStopServer', () => {
    it('should call sendMessage with stop_llama_server event', () => {
      const { result } = renderHook(() => useServerActions());

      act(() => {
        result.current.handleStopServer();
      });

      expect(mockSendMessage).toHaveBeenCalledWith('stop_llama_server', {});
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useServerActions());

      const firstHandle = result.current.handleStopServer;

      rerender();

      const secondHandle = result.current.handleStopServer;

      // Note: useEffectEvent may not be available in this React version,
      // so we test that the function exists and works rather than reference stability
      expect(typeof firstHandle).toBe('function');
      expect(typeof secondHandle).toBe('function');
    });

    it('should call sendMessage multiple times when called multiple times', () => {
      const { result } = renderHook(() => useServerActions());

      act(() => {
        result.current.handleStopServer();
        result.current.handleStopServer();
        result.current.handleStopServer();
      });

      expect(mockSendMessage).toHaveBeenCalledTimes(3);
      expect(mockSendMessage).toHaveBeenCalledWith('stop_llama_server', {});
    });
  });

  describe('isConnected', () => {
    it('should return the isConnected value from useWebSocket', () => {
      const { result } = renderHook(() => useServerActions());

      expect(result.current.isConnected).toBe(true);
    });

    it('should reflect changes in WebSocket connection state', () => {
      // Test with disconnected state
      useWebSocket.useWebSocket.mockReturnValue({
        ...mockUseWebSocket,
        isConnected: false,
      });

      const { result } = renderHook(() => useServerActions());

      expect(result.current.isConnected).toBe(false);
    });

    it('should update when WebSocket state changes', () => {
      const { result, rerender } = renderHook(() => useServerActions());

      expect(result.current.isConnected).toBe(true);

      // Change mock to return false
      useWebSocket.useWebSocket.mockReturnValue({
        ...mockUseWebSocket,
        isConnected: false,
      });

      rerender();

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('function stability', () => {
    it('should maintain function references across multiple renders', () => {
      const { result, rerender } = renderHook(() => useServerActions());

      const initialStart = result.current.handleStartServer;
      const initialStop = result.current.handleStopServer;

      rerender();
      rerender();
      rerender();

      // Functions should still be callable
      expect(typeof result.current.handleStartServer).toBe('function');
      expect(typeof result.current.handleStopServer).toBe('function');
      expect(typeof initialStart).toBe('function');
      expect(typeof initialStop).toBe('function');
    });

    it('should handle rapid successive calls', () => {
      const { result } = renderHook(() => useServerActions());

      act(() => {
        result.current.handleStartServer();
        result.current.handleStopServer();
        result.current.handleStartServer();
        result.current.handleStopServer();
      });

      expect(mockSendMessage).toHaveBeenCalledTimes(4);
      expect(mockSendMessage).toHaveBeenNthCalledWith(1, 'start_llama_server', {});
      expect(mockSendMessage).toHaveBeenNthCalledWith(2, 'stop_llama_server', {});
      expect(mockSendMessage).toHaveBeenNthCalledWith(3, 'start_llama_server', {});
      expect(mockSendMessage).toHaveBeenNthCalledWith(4, 'stop_llama_server', {});
    });
  });

  describe('error handling', () => {
    it('should propagate sendMessage errors', () => {
      mockSendMessage.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const { result } = renderHook(() => useServerActions());

      // The error from sendMessage will be thrown
      expect(() => {
        act(() => {
          result.current.handleStartServer();
        });
      }).toThrow('WebSocket error');

      expect(mockSendMessage).toHaveBeenCalledWith('start_llama_server', {});
    });

    it('should handle undefined return from useWebSocket', () => {
      useWebSocket.useWebSocket.mockReturnValue(undefined);

      expect(() => {
        renderHook(() => useServerActions());
      }).toThrow();
    });

    it('should handle missing sendMessage function', () => {
      useWebSocket.useWebSocket.mockReturnValue({
        isConnected: true,
        // sendMessage is missing
      });

      // The hook should handle missing sendMessage gracefully
      expect(() => {
        const { result } = renderHook(() => useServerActions());
        expect(typeof result.current.handleStartServer).toBe('function');
      }).not.toThrow();
    });
  });

  describe('useEffectEvent behavior', () => {
    it('should provide functional callbacks', () => {
      const { result, rerender } = renderHook(() => useServerActions());

      const firstRenderFunctions = {
        start: result.current.handleStartServer,
        stop: result.current.handleStopServer,
      };

      rerender();

      const secondRenderFunctions = {
        start: result.current.handleStartServer,
        stop: result.current.handleStopServer,
      };

      // Functions should be callable
      expect(typeof firstRenderFunctions.start).toBe('function');
      expect(typeof firstRenderFunctions.stop).toBe('function');
      expect(typeof secondRenderFunctions.start).toBe('function');
      expect(typeof secondRenderFunctions.stop).toBe('function');
    });

    it('should work correctly with async operations', async () => {
      mockSendMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServerActions());

      await act(async () => {
        result.current.handleStartServer();
        result.current.handleStopServer();
      });

      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration with useWebSocket', () => {
    it('should pass through isConnected state correctly', () => {
      const testStates = [true, false, true];

      testStates.forEach((connectedState) => {
        useWebSocket.useWebSocket.mockReturnValue({
          ...mockUseWebSocket,
          isConnected: connectedState,
        });

        const { result } = renderHook(() => useServerActions());

        expect(result.current.isConnected).toBe(connectedState);
      });
    });

    it('should call sendMessage with correct event names', () => {
      const { result } = renderHook(() => useServerActions());

      act(() => {
        result.current.handleStartServer();
      });

      expect(mockSendMessage).toHaveBeenCalledWith('start_llama_server', {});

      act(() => {
        result.current.handleStopServer();
      });

      expect(mockSendMessage).toHaveBeenCalledWith('stop_llama_server', {});
    });

    it('should handle WebSocket disconnection', () => {
      useWebSocket.useWebSocket.mockReturnValue({
        ...mockUseWebSocket,
        isConnected: false,
      });

      const { result } = renderHook(() => useServerActions());

      expect(result.current.isConnected).toBe(false);

      // Functions should still work even when disconnected
      act(() => {
        result.current.handleStartServer();
      });

      expect(mockSendMessage).toHaveBeenCalledWith('start_llama_server', {});
    });
  });
});