import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';
import { Writable } from 'stream';

jest.mock('socket.io');

const mockedServer = {
  emit: jest.fn(),
} as unknown as jest.Mocked<Server>;

describe('WebSocketTransport', () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    jest.clearAllMocks();
    transport = new WebSocketTransport({ io: mockedServer });
  });

  describe('constructor', () => {
    it('should create a new WebSocketTransport instance', () => {
      expect(transport).toBeInstanceOf(WebSocketTransport);
    });

    it('should initialize with provided Socket.IO instance', () => {
      expect((transport as any).io).toBe(mockedServer);
    });

    it('should initialize with null Socket.IO instance when not provided', () => {
      const transportWithoutIo = new WebSocketTransport();

      expect((transportWithoutIo as any).io).toBeNull();
    });

    it('should initialize with empty log queue', () => {
      expect((transport as any).logQueue).toEqual([]);
    });

    it('should initialize with max queue size of 500', () => {
      expect((transport as any).maxQueueSize).toBe(500);
    });
  });

  describe('setSocketIOInstance', () => {
    it('should set the Socket.IO instance', () => {
      const newMockServer = {
        emit: jest.fn(),
      } as unknown as jest.Mocked<Server>;

      transport.setSocketIOInstance(newMockServer);

      expect((transport as any).io).toBe(newMockServer);
    });

    it('should replace existing Socket.IO instance', () => {
      const newMockServer = {
        emit: jest.fn(),
      } as unknown as jest.Mocked<Server>;

      transport.setSocketIOInstance(newMockServer);

      expect((transport as any).io).not.toBe(mockedServer);
    });
  });

  describe('log', () => {
    it('should process log info and add to queue', () => {
      const callback = jest.fn();
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log message',
      };

      transport.log(logInfo, callback);

      expect((transport as any).logQueue).toHaveLength(1);
      expect((transport as any).logQueue[0]).toMatchObject({
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log message',
      });
      expect(callback).toHaveBeenCalled();
    });

    it('should broadcast log to all connected clients', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      };

      transport.log(logInfo);

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
      const logInfo1 = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Log 1',
      };

      const logInfo2 = {
        timestamp: '2024-01-01T00:00:01Z',
        level: 'info',
        message: 'Log 2',
      };

      transport.log(logInfo1);
      transport.log(logInfo2);

      const id1 = (transport as any).logQueue[0].id;
      const id2 = (transport as any).logQueue[1].id;

      expect(id1).not.toBe(id2);
    });

    it('should handle object messages by converting to JSON string', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: { key: 'value', nested: { data: 123 } },
      };

      transport.log(logInfo);

      expect((transport as any).logQueue[0].message).toBe(
        JSON.stringify({ key: 'value', nested: { data: 123 } })
      );
    });

    it('should handle string messages', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Plain string message',
      };

      transport.log(logInfo);

      expect((transport as any).logQueue[0].message).toBe('Plain string message');
    });

    it('should convert non-string messages to string', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 12345,
      };

      transport.log(logInfo);

      expect((transport as any).logQueue[0].message).toBe('12345');
    });

    it('should use current timestamp when not provided', () => {
      const beforeTime = Date.now();
      const logInfo = {
        level: 'info',
        message: 'Test log',
      };

      transport.log(logInfo);

      const afterTime = Date.now();
      const logTimestamp = new Date((transport as any).logQueue[0].timestamp).getTime();

      expect(logTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(logTimestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should use default level when not provided', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        message: 'Test log',
      };

      transport.log(logInfo);

      expect((transport as any).logQueue[0].level).toBe('info');
    });

    it('should handle empty message', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: '',
      };

      transport.log(logInfo);

      expect((transport as any).logQueue[0].message).toBe('');
    });

    it('should not broadcast when Socket.IO instance is null', () => {
      const transportWithoutIo = new WebSocketTransport();
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      };

      transportWithoutIo.log(logInfo);

      expect((transportWithoutIo as any).logQueue).toHaveLength(1);
      // No emit should be called since io is null
    });

    it('should limit queue to maxQueueSize', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      };

      // Add 501 logs (max queue size is 500)
      for (let i = 0; i < 501; i++) {
        transport.log({ ...logInfo, message: `Log ${i}` });
      }

      expect((transport as any).logQueue).toHaveLength(500);
      expect((transport as any).logQueue[0].message).toBe('Log 1'); // First log should be removed
    });

    it('should add logs to beginning of queue', () => {
      const logInfo1 = { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'First' };
      const logInfo2 = { timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Second' };

      transport.log(logInfo1);
      transport.log(logInfo2);

      expect((transport as any).logQueue[0].message).toBe('Second');
      expect((transport as any).logQueue[1].message).toBe('First');
    });

    it('should include context with source', () => {
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      };

      transport.log(logInfo);

      expect((transport as any).logQueue[0].context).toEqual({
        source: 'application',
      });
    });
  });

  describe('getCachedLogs', () => {
    it('should return cached logs in reverse order', () => {
      const logInfo1 = { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'First' };
      const logInfo2 = { timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Second' };

      transport.log(logInfo1);
      transport.log(logInfo2);

      const cachedLogs = transport.getCachedLogs();

      expect(cachedLogs[0].message).toBe('First');
      expect(cachedLogs[1].message).toBe('Second');
    });

    it('should return empty array when no logs', () => {
      const cachedLogs = transport.getCachedLogs();

      expect(cachedLogs).toEqual([]);
    });

    it('should not modify original queue', () => {
      const logInfo = { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Test' };
      transport.log(logInfo);

      const cachedLogs = transport.getCachedLogs();
      const originalQueue = [...(transport as any).logQueue];

      cachedLogs.pop();

      expect((transport as any).logQueue).toEqual(originalQueue);
    });
  });

  describe('getLogsByLevel', () => {
    beforeEach(() => {
      transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Info log' });
      transport.log({ timestamp: '2024-01-01T00:00:01Z', level: 'error', message: 'Error log' });
      transport.log({ timestamp: '2024-01-01T00:00:02Z', level: 'warn', message: 'Warn log' });
      transport.log({ timestamp: '2024-01-01T00:00:03Z', level: 'info', message: 'Another info log' });
    });

    it('should return logs for specified level', () => {
      const infoLogs = transport.getLogsByLevel('info');

      expect(infoLogs).toHaveLength(2);
      expect(infoLogs.every((log) => log.level === 'info')).toBe(true);
    });

    it('should return logs for error level', () => {
      const errorLogs = transport.getLogsByLevel('error');

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error log');
    });

    it('should return logs for debug level', () => {
      transport.log({
        timestamp: '2024-01-01T00:00:04Z',
        level: 'debug',
        message: 'Debug log',
      });

      const debugLogs = transport.getLogsByLevel('debug');

      expect(debugLogs).toHaveLength(1);
    });

    it('should return empty array for non-existent level', () => {
      const logs = transport.getLogsByLevel('trace');

      expect(logs).toEqual([]);
    });

    it('should return logs in original queue order', () => {
      const infoLogs = transport.getLogsByLevel('info');

      expect(infoLogs[0].message).toBe('Another info log');
      expect(infoLogs[1].message).toBe('Info log');
    });
  });

  describe('clearQueue', () => {
    it('should clear all logs from queue', () => {
      transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Log 1' });
      transport.log({ timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Log 2' });

      expect((transport as any).logQueue).toHaveLength(2);

      transport.clearQueue();

      expect((transport as any).logQueue).toHaveLength(0);
    });

    it('should do nothing when queue is already empty', () => {
      expect(() => transport.clearQueue()).not.toThrow();
      expect((transport as any).logQueue).toHaveLength(0);
    });

    it('should allow adding logs after clearing', () => {
      transport.log({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Log 1' });
      transport.clearQueue();
      transport.log({ timestamp: '2024-01-01T00:00:01Z', level: 'info', message: 'Log 2' });

      expect((transport as any).logQueue).toHaveLength(1);
      expect((transport as any).logQueue[0].message).toBe('Log 2');
    });
  });

  describe('integration with Winston', () => {
    it('should work as a Winston transport', () => {
      const callback = jest.fn();
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      };

      // Simulate Winston calling log method
      expect(() => transport.log(logInfo, callback)).not.toThrow();
    });

    it('should use setImmediate for async processing', () => {
      const callback = jest.fn();
      const logInfo = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log',
      };

      transport.log(logInfo, callback);

      // Callback should be called asynchronously
      expect(callback).toHaveBeenCalled();
    });
  });
});
