import { WebSocketTransport } from '@/lib/websocket-transport';
import { Server } from 'socket.io';
import winston from 'winston';

jest.mock('socket.io');

describe('WebSocketTransport', () => {
  let mockIo: jest.Mocked<Server>;
  let transport: WebSocketTransport;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo = {
      emit: jest.fn(),
    } as any;
    transport = new WebSocketTransport();
  });

  describe('constructor', () => {
    it('should create transport without io instance', () => {
      const newTransport = new WebSocketTransport();

      expect(newTransport).toBeInstanceOf(winston.Transport);
    });

    it('should create transport with io instance', () => {
      const newTransport = new WebSocketTransport({ io: mockIo });

      expect(newTransport).toBeInstanceOf(winston.Transport);
    });
  });

  describe('setSocketIOInstance', () => {
    it('should set Socket.IO instance', () => {
      transport.setSocketIOInstance(mockIo);

      expect(transport['io']).toBe(mockIo);
    });

    it('should replace existing instance', () => {
      const mockIo2 = { emit: jest.fn() } as any;
      transport.setSocketIOInstance(mockIo);
      transport.setSocketIOInstance(mockIo2);

      expect(transport['io']).toBe(mockIo2);
    });
  });

  describe('log', () => {
    it('should call callback', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
      };

      transport.log(info, callback);

      setImmediate(() => {
        expect(callback).toHaveBeenCalled();
        done();
      });
    });

    it('should add log entry to queue', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
      };

      transport.log(info, callback);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs).toHaveLength(1);
        expect(cachedLogs[0].message).toBe('Test message');
        done();
      });
    });

    it('should generate unique log ID', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Message 1',
      };

      transport.log(info, callback);
      transport.log(info, callback);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].id).not.toBe(cachedLogs[1].id);
        done();
      });
    });

    it('should set default timestamp if not provided', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Test message',
      };

      transport.log(info, callback);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].timestamp).toBeDefined();
        expect(new Date(cachedLogs[0].timestamp)).not.toBeNaN();
        done();
      });
    });

    it('should set default level if not provided', (done) => {
      const callback = jest.fn();
      const info = {
        message: 'Test message',
      };

      transport.log(info, callback);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].level).toBe('info');
        done();
      });
    });

    it('should convert object message to string', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: { key: 'value', nested: { data: 123 } },
      };

      transport.log(info, callback);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(typeof cachedLogs[0].message).toBe('string');
        expect(cachedLogs[0].message).toContain('key');
        done();
      });
    });

    it('should add source context', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Test message',
      };

      transport.log(info, callback);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].context).toEqual({
          source: 'application',
        });
        done();
      });
    });

    it('should limit queue size to 500', (done) => {
      const callback = jest.fn();
      const info = { level: 'info', message: 'Test' };

      for (let i = 0; i < 600; i++) {
        transport.log({ ...info, message: `Test ${i}` }, callback);
      }

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs.length).toBeLessThanOrEqual(500);
        done();
      });
    });

    it('should emit log via Socket.IO when instance is set', (done) => {
      transport.setSocketIOInstance(mockIo);
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
      };

      transport.log(info, callback);

      setImmediate(() => {
        expect(mockIo.emit).toHaveBeenCalledWith('log', {
          type: 'log',
          data: expect.objectContaining({
            level: 'info',
            message: 'Test message',
          }),
          timestamp: expect.any(Number),
        });
        done();
      });
    });

    it('should not emit when Socket.IO instance is not set', (done) => {
      const callback = jest.fn();
      const info = {
        level: 'info',
        message: 'Test message',
      };

      transport.log(info, callback);

      setImmediate(() => {
        expect(mockIo.emit).not.toHaveBeenCalled();
        done();
      });
    });

    it('should work without callback', (done) => {
      const info = {
        level: 'info',
        message: 'Test message',
      };

      transport.log(info);

      setImmediate(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs).toHaveLength(1);
        done();
      });
    });
  });

  describe('getCachedLogs', () => {
    beforeEach((done) => {
      const callback = jest.fn();
      const info1 = { level: 'info', message: 'Message 1' };
      const info2 = { level: 'error', message: 'Message 2' };

      transport.log(info1, callback);
      transport.log(info2, callback);

      setImmediate(done);
    });

    it('should return cached logs', () => {
      const cachedLogs = transport.getCachedLogs();

      expect(cachedLogs).toHaveLength(2);
      expect(cachedLogs[0].message).toBe('Message 2');
      expect(cachedLogs[1].message).toBe('Message 1');
    });

    it('should return a copy of logs', () => {
      const logs1 = transport.getCachedLogs();
      const logs2 = transport.getCachedLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });
  });

  describe('getLogsByLevel', () => {
    beforeEach((done) => {
      const callback = jest.fn();
      transport.log({ level: 'info', message: 'Info 1' }, callback);
      transport.log({ level: 'error', message: 'Error 1' }, callback);
      transport.log({ level: 'info', message: 'Info 2' }, callback);
      transport.log({ level: 'warn', message: 'Warn 1' }, callback);

      setImmediate(done);
    });

    it('should return logs for specific level', () => {
      const infoLogs = transport.getLogsByLevel('info');

      expect(infoLogs).toHaveLength(2);
      expect(infoLogs.every(log => log.level === 'info')).toBe(true);
    });

    it('should return empty array for non-existent level', () => {
      const debugLogs = transport.getLogsByLevel('debug');

      expect(debugLogs).toEqual([]);
    });

    it('should handle case-sensitive level matching', () => {
      const infoLogs = transport.getLogsByLevel('INFO');

      expect(infoLogs).toHaveLength(0);
    });
  });

  describe('clearQueue', () => {
    beforeEach((done) => {
      const callback = jest.fn();
      transport.log({ level: 'info', message: 'Message 1' }, callback);
      transport.log({ level: 'error', message: 'Message 2' }, callback);

      setImmediate(done);
    });

    it('should clear all logs from queue', () => {
      expect(transport.getCachedLogs()).toHaveLength(2);

      transport.clearQueue();

      expect(transport.getCachedLogs()).toHaveLength(0);
    });
  });

  describe('integration', () => {
    it('should handle log lifecycle', (done) => {
      const callback = jest.fn();

      transport.log({ level: 'info', message: 'First log' }, callback);
      transport.log({ level: 'error', message: 'Error log' }, callback);
      transport.log({ level: 'warn', message: 'Warning log' }, callback);

      setImmediate(() => {
        expect(transport.getCachedLogs()).toHaveLength(3);
        expect(transport.getLogsByLevel('info')).toHaveLength(1);
        expect(transport.getLogsByLevel('error')).toHaveLength(1);
        expect(transport.getLogsByLevel('warn')).toHaveLength(1);

        transport.clearQueue();
        expect(transport.getCachedLogs()).toHaveLength(0);
        done();
      });
    });

    it('should integrate with Socket.IO emission', (done) => {
      transport.setSocketIOInstance(mockIo);
      const callback = jest.fn();

      transport.log({ level: 'info', message: 'Test' }, callback);

      setImmediate(() => {
        expect(mockIo.emit).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
