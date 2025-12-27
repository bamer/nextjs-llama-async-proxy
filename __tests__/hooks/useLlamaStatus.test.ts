import { renderHook, act, waitFor } from '@testing-library/react';
import { useLlamaStatus } from '@/hooks/useLlamaStatus';

jest.mock('@/lib/websocket-client', () => ({
  websocketServer: {
    on: jest.fn(),
    off: jest.fn(),
    sendMessage: jest.fn(),
    getSocket: jest.fn(() => null),
  },
}));

const { websocketServer } = require('@/lib/websocket-client');

describe('useLlamaStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with initial state and loading', () => {
    const { result } = renderHook(() => useLlamaStatus());

    expect(result.current.status).toBe('initial');
    expect(result.current.models).toEqual([]);
    expect(result.current.lastError).toBe(null);
    expect(result.current.retries).toBe(0);
    expect(result.current.uptime).toBe(0);
    expect(result.current.startedAt).toBe(null);
    expect(result.current.isLoading).toBe(true);
  });

  it('should request initial status on mount', () => {
    renderHook(() => useLlamaStatus());

    expect(websocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus');
    expect(websocketServer.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('should set up message event listener on mount', () => {
    renderHook(() => useLlamaStatus());

    expect(websocketServer.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledTimes(1);
  });

  it('should update state when llama_status message is received', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const statusMessage = {
      type: 'llama_status',
      data: {
        status: 'running',
        models: [
          { id: 'model1', name: 'Model 1' },
          { id: 'model2', name: 'Model 2' },
        ],
        lastError: null,
        retries: 2,
        uptime: 12345,
        startedAt: '2025-01-01T00:00:00Z',
      },
    };

    act(() => {
      messageHandler(statusMessage);
    });

    expect(result.current.status).toBe('running');
    expect(result.current.models).toEqual([
      { id: 'model1', name: 'Model 1' },
      { id: 'model2', name: 'Model 2' },
    ]);
    expect(result.current.lastError).toBe(null);
    expect(result.current.retries).toBe(2);
    expect(result.current.uptime).toBe(12345);
    expect(result.current.startedAt).toBe('2025-01-01T00:00:00Z');
    expect(result.current.isLoading).toBe(false);
  });

  it('should set loading to false when data is received', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    expect(result.current.isLoading).toBe(true);

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: { status: 'running', models: [], lastError: null, retries: 0, uptime: 0, startedAt: null },
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle models array correctly when empty', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'stopped',
          models: null,
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
      });
    });

    expect(result.current.models).toEqual([]);
  });

  it('should handle models array when undefined', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'loading',
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
      });
    });

    expect(result.current.models).toEqual([]);
  });

  it('should handle last error in status', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'error',
          models: [],
          lastError: 'Failed to load model',
          retries: 5,
          uptime: 0,
          startedAt: null,
        },
      });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.lastError).toBe('Failed to load model');
    expect(result.current.retries).toBe(5);
  });

  it('should handle multiple status updates', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: { status: 'loading', models: [], lastError: null, retries: 0, uptime: 0, startedAt: null },
      });
    });

    expect(result.current.status).toBe('loading');

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: { status: 'running', models: [{ id: 'm1', name: 'M1' }], lastError: null, retries: 0, uptime: 100, startedAt: null },
      });
    });

    expect(result.current.status).toBe('running');
    expect(result.current.models).toEqual([{ id: 'm1', name: 'M1' }]);
    expect(result.current.uptime).toBe(100);
  });

  it('should ignore messages that are not llama_status type', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const initialStatus = result.current.status;

    act(() => {
      messageHandler({ type: 'metrics', data: { cpu: 50 } });
    });

    expect(result.current.status).toBe(initialStatus);
  });

  it('should handle messages with missing data property', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const initialStatus = result.current.status;

    act(() => {
      messageHandler({ type: 'llama_status' });
    });

    expect(result.current.status).toBe(initialStatus);
  });

  it('should handle messages with null data', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const initialStatus = result.current.status;

    act(() => {
      messageHandler({ type: 'llama_status', data: null });
    });

    expect(result.current.status).toBe(initialStatus);
  });

  it('should cleanup message listener on unmount', () => {
    const { unmount } = renderHook(() => useLlamaStatus());

    expect(websocketServer.on).toHaveBeenCalledTimes(1);
    expect(websocketServer.off).not.toHaveBeenCalled();

    unmount();

    expect(websocketServer.off).toHaveBeenCalledWith('message', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledTimes(1);
  });

  it('should set up socket listener when socket is available', () => {
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
    };

    websocketServer.getSocket.mockReturnValue(mockSocket);

    renderHook(() => useLlamaStatus());

    expect(mockSocket.on).toHaveBeenCalledWith('llamaStatus', expect.any(Function));
  });

  it('should handle llamaStatus event from socket', async () => {
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
    };

    websocketServer.getSocket.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useLlamaStatus());

    const socketHandler = mockSocket.on.mock.calls[0][1];

    act(() => {
      socketHandler({
        status: 'running',
        models: [{ id: 'm1', name: 'Model 1' }],
        lastError: null,
        retries: 1,
        uptime: 500,
        startedAt: '2025-01-01T00:00:00Z',
      });
    });

    expect(result.current.status).toBe('running');
    expect(result.current.models).toEqual([{ id: 'm1', name: 'Model 1' }]);
    expect(result.current.uptime).toBe(500);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not set up socket listener when socket is null', () => {
    websocketServer.getSocket.mockReturnValue(null);

    renderHook(() => useLlamaStatus());

    expect(websocketServer.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should maintain consistent state structure', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'running',
          models: [],
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
      });
    });

    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('models');
    expect(result.current).toHaveProperty('lastError');
    expect(result.current).toHaveProperty('retries');
    expect(result.current).toHaveProperty('uptime');
    expect(result.current).toHaveProperty('startedAt');
    expect(result.current).toHaveProperty('isLoading');
  });

  it('should handle zero uptime', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'stopped',
          models: [],
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
      });
    });

    expect(result.current.uptime).toBe(0);
  });

  it('should handle large uptime values', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'running',
          models: [],
          lastError: null,
          retries: 0,
          uptime: 999999999,
          startedAt: null,
        },
      });
    });

    expect(result.current.uptime).toBe(999999999);
  });

  it('should handle complex model objects', async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const complexModels = [
      {
        id: 'model1',
        name: 'Model 1',
        size: '7B',
        quantization: 'Q4_K_M',
        memory: '4.2GB',
      },
      {
        id: 'model2',
        name: 'Model 2',
        size: '13B',
        quantization: 'Q4_K_M',
        memory: '7.8GB',
      },
    ];

    act(() => {
      messageHandler({
        type: 'llama_status',
        data: {
          status: 'running',
          models: complexModels,
          lastError: null,
          retries: 0,
          uptime: 1000,
          startedAt: '2025-01-01T00:00:00Z',
        },
      });
    });

    expect(result.current.models).toEqual(complexModels);
    expect(result.current.models).toHaveLength(2);
  });
});
