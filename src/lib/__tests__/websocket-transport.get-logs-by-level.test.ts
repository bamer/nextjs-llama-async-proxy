import { WebSocketTransport } from '@/lib/websocket-transport';
import { createTransport } from './websocket-transport.test-utils';

describe('WebSocketTransport - getLogsByLevel', () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    jest.clearAllMocks();
    transport = createTransport();
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
    transport.log({ timestamp: '2024-01-01T00:00:04Z', level: 'debug', message: 'Debug log' });

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
