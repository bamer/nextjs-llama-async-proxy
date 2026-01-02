import { WebSocketTransport } from '@/lib/websocket-transport';
import { createTransport, getLogQueue } from './websocket-transport.test-utils';

describe('WebSocketTransport - clearQueue', () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    transport = createTransport();
  });

  it('should clear all logs from queue', () => {
    transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Log 1' });
    transport.log({ timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Log 2' });

    expect(getLogQueue(transport)).toHaveLength(2);

    transport.clearQueue();

    expect(getLogQueue(transport)).toHaveLength(0);
  });

  it('should do nothing when queue is already empty', () => {
    expect(() => transport.clearQueue()).not.toThrow();
    expect(getLogQueue(transport)).toHaveLength(0);
  });

  it('should allow adding logs after clearing', () => {
    transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Log 1' });
    transport.clearQueue();
    transport.log({ timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Log 2' });

    expect(getLogQueue(transport)).toHaveLength(1);
    expect(getLogQueue(transport)[0].message).toBe('Log 2');
  });
});
