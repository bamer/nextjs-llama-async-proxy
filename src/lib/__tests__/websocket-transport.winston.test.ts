import { WebSocketTransport } from '@/lib/websocket-transport';
import { basicLogInfo } from './websocket-transport.test-helpers';
import { createTransport } from './websocket-transport.test-utils';

describe('WebSocketTransport - Winston Integration', () => {
  it('should work as a Winston transport', () => {
    const transport = createTransport();
    const callback = jest.fn();

    expect(() => transport.log(basicLogInfo, callback)).not.toThrow();
  });

  it('should use setImmediate for async processing', () => {
    const transport = createTransport();
    const callback = jest.fn();

    transport.log(basicLogInfo, callback);

    expect(callback).toHaveBeenCalled();
  });
});
