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

describe('useWebSocket - Request Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketContext.isConnected = false;
  });

  it('should provide sendMessage method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('should provide requestMetrics method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.requestMetrics).toBe('function');
  });

  it('should provide requestLogs method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.requestLogs).toBe('function');
  });

  it('should provide requestModels method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.requestModels).toBe('function');
  });

  it('should provide startModel method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.startModel).toBe('function');
  });

  it('should provide stopModel method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.stopModel).toBe('function');
  });

  it('should provide on method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.on).toBe('function');
  });

  it('should provide off method', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.off).toBe('function');
  });
});
