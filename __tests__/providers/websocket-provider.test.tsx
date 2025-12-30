/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { WebSocketProvider, useWebSocketContext } from '@/providers/websocket-provider';

jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');

const { websocketServer } = require('@/lib/websocket-client');
const { useStore } = require('@/lib/store');

describe('WebSocketProvider', () => {
  let mockStore: any;

  const mockMetrics = {
    cpuUsage: 45.6,
    memoryUsage: 67.3,
    totalRequests: 100,
    timestamp: Date.now(),
  };

  const mockLogs = [
    { id: 1, level: 'info', message: 'Log 1', timestamp: Date.now() },
    { id: 2, level: 'warn', message: 'Log 2', timestamp: Date.now() },
  ];

  const mockModels = [
    { id: '1', name: 'Model 1', status: 'idle' },
    { id: '2', name: 'Model 2', status: 'running' },
  ];

  const mockModelConfig = {
    id: '1',
    name: 'Model 1',
    status: 'running',
    path: '/path/to/model',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockStore = {
      setMetrics: jest.fn(),
      addLog: jest.fn(),
      setModels: jest.fn(),
      updateModel: jest.fn(),
      setLlamaServerStatus: jest.fn(),
      models: mockModels,
    };

    useStore.getState = jest.fn().mockReturnValue(mockStore);

    websocketServer.connect = jest.fn();
    websocketServer.on = jest.fn();
    websocketServer.off = jest.fn();
    websocketServer.requestMetrics = jest.fn();
    websocketServer.requestLogs = jest.fn();
    websocketServer.requestModels = jest.fn();
    websocketServer.startModel = jest.fn();
    websocketServer.stopModel = jest.fn();
    websocketServer.sendMessage = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const TestComponent = () => {
    const context = useWebSocketContext();
    return (
      <div>
        <span data-testid="isConnected">{context.isConnected.toString()}</span>
        <span data-testid="connectionState">{context.connectionState}</span>
      </div>
    );
  };

  it('renders children correctly', () => {
    render(
      <WebSocketProvider>
        <div>Test Child</div>
      </WebSocketProvider>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('connects to WebSocket on mount', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    expect(websocketServer.connect).toHaveBeenCalledTimes(1);
  });

  it('sets up event listeners on mount', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    expect(websocketServer.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('handles connect event correctly', () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'connect')[1];

    act(() => {
      connectHandler();
    });

    expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
    expect(screen.getByTestId('connectionState')).toHaveTextContent('connected');
    expect(websocketServer.requestMetrics).toHaveBeenCalledTimes(1);
    expect(websocketServer.requestLogs).toHaveBeenCalledTimes(1);
  });

  it('handles disconnect event correctly', () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
    const disconnectHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'disconnect')[1];

    act(() => {
      connectHandler();
    });

    expect(screen.getByTestId('isConnected')).toHaveTextContent('true');

    act(() => {
      disconnectHandler();
    });

    expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
    expect(screen.getByTestId('connectionState')).toHaveTextContent('disconnected');
  });

  it('handles connect_error event correctly', () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    const errorHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'connect_error')[1];

    act(() => {
      errorHandler(new Error('Connection failed'));
    });

    expect(screen.getByTestId('connectionState')).toHaveTextContent('error');
  });

  it('handles metrics message with batching', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const metricsMessage = { type: 'metrics', data: mockMetrics };

    act(() => {
      messageHandler(metricsMessage);
    });

    expect(mockStore.setMetrics).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStore.setMetrics).toHaveBeenCalledWith(mockMetrics);
  });

  it('handles logs message with batching', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const logsMessage = { type: 'logs', data: mockLogs };

    act(() => {
      messageHandler(logsMessage);
    });

    expect(mockStore.addLog).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockStore.addLog).toHaveBeenCalledTimes(mockLogs.length);
    mockLogs.forEach(log => {
      expect(mockStore.addLog).toHaveBeenCalledWith(log);
    });
  });

  it('handles single log message with shorter debounce', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const logMessage = { type: 'log', data: mockLogs[0] };

    act(() => {
      messageHandler(logMessage);
    });

    expect(mockStore.addLog).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStore.addLog).toHaveBeenCalledWith(mockLogs[0]);
  });

  it('handles status message with model updates', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const statusMessage = {
      type: 'status',
      data: {
        models: [mockModelConfig],
        status: 'running'
      }
    };

    act(() => {
      messageHandler(statusMessage);
    });

    expect(mockStore.updateModel).toHaveBeenCalledWith('1', { status: 'running' });
  });

  it('handles models_loaded message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const modelsLoadedMessage = { type: 'models_loaded', data: mockModels };

    act(() => {
      messageHandler(modelsLoadedMessage);
    });

    expect(mockStore.setModels).toHaveBeenCalledWith(mockModels);
  });

  it('ignores models message from llama-server', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const modelsMessage = { type: 'models', data: mockModels };

    act(() => {
      messageHandler(modelsMessage);
    });

    expect(mockStore.setModels).not.toHaveBeenCalled();
  });

  it('handles llamaServerStatus message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const statusMessage = { type: 'llamaServerStatus', data: { status: 'running' } };

    act(() => {
      messageHandler(statusMessage);
    });

    expect(mockStore.setLlamaServerStatus).toHaveBeenCalledWith({ status: 'running' });
  });

  it('handles modelStopped message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const stoppedMessage = { type: 'modelStopped', data: { modelId: '1' } };

    act(() => {
      messageHandler(stoppedMessage);
    });

    // No specific action expected, just logged
  });

  it('provides context value with correct methods', () => {
    const TestConsumer = () => {
      const context = useWebSocketContext();
      expect(typeof context.sendMessage).toBe('function');
      expect(typeof context.requestMetrics).toBe('function');
      expect(typeof context.requestLogs).toBe('function');
      expect(typeof context.requestModels).toBe('function');
      expect(typeof context.startModel).toBe('function');
      expect(typeof context.stopModel).toBe('function');
      expect(typeof context.unloadModel).toBe('function');
      expect(typeof context.on).toBe('function');
      expect(typeof context.off).toBe('function');
      expect(context.isConnected).toBe(false);
      expect(context.connectionState).toBe('disconnected');
      return <div>Test passed</div>;
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    expect(screen.getByText('Test passed')).toBeInTheDocument();
  });

  it('sendMessage does not send when not connected', () => {
    const TestConsumer = () => {
      const context = useWebSocketContext();
      return (
        <button onClick={() => context.sendMessage('test', { data: 'test' })}>
          Send Message
        </button>
      );
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    const sendButton = screen.getByText('Send Message');

    act(() => {
      sendButton.click();
    });

    expect(websocketServer.sendMessage).not.toHaveBeenCalled();
  });

  it('sendMessage sends when connected', () => {
    const TestConsumer = () => {
      const context = useWebSocketContext();
      return (
        <button onClick={() => context.sendMessage('test', { data: 'test' })}>
          Send Message
        </button>
      );
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'connect')[1];

    act(() => {
      connectHandler();
    });

    const sendButton = screen.getByText('Send Message');

    act(() => {
      sendButton.click();
    });

    expect(websocketServer.sendMessage).toHaveBeenCalledWith('test', { data: 'test' });
  });

  it('flushes batched data on unmount', () => {
    const { unmount } = render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    // Add some batched data
    act(() => {
      messageHandler({ type: 'metrics', data: mockMetrics });
      messageHandler({ type: 'logs', data: mockLogs });
    });

    act(() => {
      unmount();
    });

    expect(mockStore.setMetrics).toHaveBeenCalledWith(mockMetrics);
    expect(mockStore.addLog).toHaveBeenCalledTimes(mockLogs.length);
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    act(() => {
      unmount();
    });

    expect(websocketServer.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('useWebSocketContext throws error outside provider', () => {
    const TestComponent = () => {
      useWebSocketContext();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useWebSocketContext must be used within WebSocketProvider'
    );
  });

  it('handles malformed message gracefully', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    act(() => {
      messageHandler({});
      messageHandler({ type: 'unknown' });
      messageHandler(null);
      messageHandler(undefined);
    });

    // Should not throw or call any store methods
    expect(mockStore.setMetrics).not.toHaveBeenCalled();
    expect(mockStore.addLog).not.toHaveBeenCalled();
  });

  it('batches multiple metrics correctly', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const metrics1 = { ...mockMetrics, cpuUsage: 30 };
    const metrics2 = { ...mockMetrics, cpuUsage: 50 };

    act(() => {
      messageHandler({ type: 'metrics', data: metrics1 });
      messageHandler({ type: 'metrics', data: metrics2 });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStore.setMetrics).toHaveBeenCalledTimes(1);
    expect(mockStore.setMetrics).toHaveBeenCalledWith(metrics2); // Last one wins
  });

  it('handles models_imported message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    const importedMessage = { type: 'models_imported', data: mockModels };

    act(() => {
      messageHandler(importedMessage);
    });

    expect(mockStore.setModels).toHaveBeenCalledWith(mockModels);
  });

  it('handles save_model, update_model, delete_model, load_config messages', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    act(() => {
      messageHandler({ type: 'save_model', data: {} });
      messageHandler({ type: 'update_model', data: {} });
      messageHandler({ type: 'delete_model', data: {} });
      messageHandler({ type: 'load_config', data: {} });
    });

    // These should be logged as warnings but not throw
  });

  it('handles save_config message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    act(() => {
      messageHandler({ type: 'save_config', data: { config: 'data' } });
    });

    // Should be logged but no specific action
  });

  it('handles config_saved message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    act(() => {
      messageHandler({ type: 'config_saved', success: true, data: { config: 'data' } });
    });

    // Should be logged but no specific action
  });

  it('handles model_saved, model_updated, model_deleted messages', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    act(() => {
      messageHandler({ type: 'model_saved', data: {} });
      messageHandler({ type: 'model_updated', data: {} });
      messageHandler({ type: 'model_deleted', data: {} });
    });

    // Should be logged but no specific action
  });

  it('handles config_loaded message', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'message')[1];

    act(() => {
      messageHandler({ type: 'config_loaded', data: {} });
    });

    // Should be logged but no specific action
  });

  it('initial state is disconnected', () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
    expect(screen.getByTestId('connectionState')).toHaveTextContent('disconnected');
  });

  it('does not request models on connect (uses database)', () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: any) => call[0] === 'connect')[1];

    act(() => {
      connectHandler();
    });

    expect(websocketServer.requestModels).not.toHaveBeenCalled();
  });

  it('provides all required context methods', () => {
    const TestConsumer = () => {
      const context = useWebSocketContext();
      return (
        <div>
          <span data-testid="methods">
            {typeof context.sendMessage === 'function' &&
             typeof context.requestMetrics === 'function' &&
             typeof context.requestLogs === 'function' &&
             typeof context.requestModels === 'function' &&
             typeof context.startModel === 'function' &&
             typeof context.stopModel === 'function' &&
             typeof context.unloadModel === 'function' &&
             typeof context.on === 'function' &&
             typeof context.off === 'function' ? 'all-present' : 'missing'}
          </span>
        </div>
      );
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    expect(screen.getByTestId('methods')).toHaveTextContent('all-present');
  });
});