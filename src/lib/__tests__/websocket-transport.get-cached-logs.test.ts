import { WebSocketTransport } from '@/lib/websocket-transport';
import { createTransport, getLogQueue } from './websocket-transport.test-utils';

describe('WebSocketTransport - getCachedLogs', () => {
  it('should return cached logs in reverse order', () => {
    const transport = createTransport();
    transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'First' });
    transport.log({ timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Second' });

    const cachedLogs = transport.getCachedLogs();

    expect(cachedLogs[0].message).toBe('First');
    expect(cachedLogs[1].message).toBe('Second');
  });

  it('should return empty array when no logs', () => {
    const transport = createTransport();
    const cachedLogs = transport.getCachedLogs();
    expect(cachedLogs).toEqual([]);
  });

  it('should not modify original queue', () => {
    const transport = createTransport();
    transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Test' });

    const cachedLogs = transport.getCachedLogs();
    const originalQueue = [...getLogQueue(transport)];

    cachedLogs.pop();

    expect(getLogQueue(transport)).toEqual(originalQueue);
  });
});
