import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';
import { createMockLogger, setSocketIOInstance, getWebSocketTransport } from './logger.test-utils';

jest.mock('@/lib/websocket-transport');
jest.mock('socket.io');

describe('Logger WebSocket Integration', () => {
  let mockWsTransport: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWsTransport = {
      setSocketIOInstance: jest.fn(),
    };
    (WebSocketTransport as unknown as jest.Mock).mockReturnValue(mockWsTransport);
  });

  it('should set Socket.IO instance on transport', () => {
    const mockIo = {} as Server;
    createMockLogger();

    setSocketIOInstance(mockIo);

    expect(mockWsTransport.setSocketIOInstance).toHaveBeenCalledWith(mockIo);
  });

  it('should handle null wsTransport gracefully', () => {
    const mockIo = {} as Server;
    expect(() => setSocketIOInstance(mockIo)).not.toThrow();
  });

  it('should return WebSocket transport', () => {
    getWebSocketTransport.mockReturnValue(mockWsTransport);
    createMockLogger();

    const transport = getWebSocketTransport();
    expect(transport).toBe(mockWsTransport);
  });
});
