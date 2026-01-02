import { WebSocketTransport } from '@/lib/websocket-transport';
import { mockedServer, createTransport } from './websocket-transport.test-utils';

describe('WebSocketTransport - Constructor', () => {
  it('should create a new WebSocketTransport instance', () => {
    const transport = createTransport();
    expect(transport).toBeInstanceOf(WebSocketTransport);
  });

  it('should initialize with provided Socket.IO instance', () => {
    const transport = createTransport();
    expect((transport as any).io).toBe(mockedServer);
  });

  it('should initialize with null Socket.IO instance when not provided', () => {
    const transport = new WebSocketTransport();
    expect((transport as any).io).toBeNull();
  });

  it('should initialize with empty log queue', () => {
    const transport = createTransport();
    expect((transport as any).logQueue).toEqual([]);
  });

  it('should initialize with max queue size of 500', () => {
    const transport = createTransport();
    expect((transport as any).maxQueueSize).toBe(500);
  });
});
