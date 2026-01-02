import { WebSocketTransport } from '@/lib/websocket-transport';

export const basicLogInfo = {
  timestamp: '2024-01-01T00:00:00Z',
  level: 'info',
  message: 'Test log message',
};

export const objectLogInfo = {
  timestamp: '2024-01-01T00:00:00Z',
  level: 'info',
  message: { key: 'value', nested: { data: 123 } },
};

export const numericLogInfo = {
  timestamp: '2024-01-01T00:00:00Z',
  level: 'info',
  message: 12345,
};

export const emptyMessageLogInfo = {
  timestamp: '2024-01-01T00:00:00Z',
  level: 'info',
  message: '',
};

export const logInfoWithoutTimestamp = {
  level: 'info',
  message: 'Test log',
};

export const logInfoWithoutLevel = {
  timestamp: '2024-01-01T00:00:00Z',
  message: 'Test log',
};

/**
 * Helper to validate log entry structure
 */
export function validateLogEntry(entry: any, expected: any) {
  expect(entry).toMatchObject({
    timestamp: expected.timestamp || expect.any(String),
    level: expected.level || 'info',
    message: expect.any(String),
    id: expect.any(String),
    context: expected.context || { source: 'application' },
  });
}
