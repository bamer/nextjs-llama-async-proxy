import { WebSocketTransport } from '@/lib/websocket-transport';
import { createTransport, createTransportWithoutIo, addLogs, getLogQueue, mockedServer } from './websocket-transport.test-utils';
import {
  basicLogInfo,
  objectLogInfo,
  numericLogInfo,
  emptyMessageLogInfo,
  logInfoWithoutTimestamp,
  logInfoWithoutLevel,
} from './websocket-transport.test-helpers';

describe('WebSocketTransport - log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process log info and add to queue', () => {
    const callback = jest.fn();
    const transport = createTransport();

    transport.log(basicLogInfo, callback);

    expect(getLogQueue(transport)).toHaveLength(1);
    expect(getLogQueue(transport)[0]).toMatchObject({
      timestamp: '2024-01-01T00:00:00Z',
      level: 'info',
      message: 'Test log message',
    });
    expect(callback).toHaveBeenCalled();
  });

  it('should broadcast log to all connected clients', () => {
    const transport = createTransport();
    transport.log(basicLogInfo);

    expect(mockedServer.emit).toHaveBeenCalledWith('log', {
      type: 'log',
      data: expect.objectContaining({
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      }),
      timestamp: expect.any(Number),
    });
  });

  it('should generate unique log ID', () => {
    const transport = createTransport();
    transport.log(basicLogInfo);
    transport.log({ ...basicLogInfo, timestamp: '2024-01-01T00:00:01Z', message: 'Log 2' });

    const id1 = getLogQueue(transport)[0].id;
    const id2 = getLogQueue(transport)[1].id;
    expect(id1).not.toBe(id2);
  });

  it('should handle object messages by converting to JSON string', () => {
    const transport = createTransport();
    transport.log(objectLogInfo);

    expect(getLogQueue(transport)[0].message).toBe(
      JSON.stringify({ key: 'value', nested: { data: 123 } })
    );
  });

  it('should handle string messages', () => {
    const transport = createTransport();
    transport.log({ ...basicLogInfo, message: 'Plain string message' });

    expect(getLogQueue(transport)[0].message).toBe('Plain string message');
  });

  it('should convert non-string messages to string', () => {
    const transport = createTransport();
    transport.log(numericLogInfo);

    expect(getLogQueue(transport)[0].message).toBe('12345');
  });

  it('should use current timestamp when not provided', () => {
    const transport = createTransport();
    const beforeTime = Date.now();

    transport.log(logInfoWithoutTimestamp);

    const afterTime = Date.now();
    const logTimestamp = new Date(getLogQueue(transport)[0].timestamp).getTime();

    expect(logTimestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(logTimestamp).toBeLessThanOrEqual(afterTime);
  });

  it('should use default level when not provided', () => {
    const transport = createTransport();
    transport.log(logInfoWithoutLevel);

    expect(getLogQueue(transport)[0].level).toBe('info');
  });

  it('should handle empty message', () => {
    const transport = createTransport();
    transport.log(emptyMessageLogInfo);

    expect(getLogQueue(transport)[0].message).toBe('');
  });

  it('should not broadcast when Socket.IO instance is null', () => {
    const transportWithoutIo = createTransportWithoutIo();
    transportWithoutIo.log(basicLogInfo);

    expect(getLogQueue(transportWithoutIo)).toHaveLength(1);
    // No emit should be called since io is null
  });

  it('should limit queue to maxQueueSize', () => {
    const transport = createTransport();
    addLogs(transport, 501);

    expect(getLogQueue(transport)).toHaveLength(500);
    expect(getLogQueue(transport)[0].message).toBe('Log 1');
  });

  it('should add logs to beginning of queue', () => {
    const transport = createTransport();
    transport.log({ ...basicLogInfo, message: 'First', timestamp: '2024-01-01T00:00:00Z' });
    transport.log({ ...basicLogInfo, message: 'Second', timestamp: '2024-01-01T00:00:01Z' });

    expect(getLogQueue(transport)[0].message).toBe('Second');
    expect(getLogQueue(transport)[1].message).toBe('First');
  });

  it('should include context with source', () => {
    const transport = createTransport();
    transport.log(basicLogInfo);

    expect(getLogQueue(transport)[0].context).toEqual({
      source: 'application',
    });
  });
});
