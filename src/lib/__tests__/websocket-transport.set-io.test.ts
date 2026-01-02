import { WebSocketTransport } from '@/lib/websocket-transport';
import { createTransport, mockedServer } from './websocket-transport.test-utils';
import { Server } from 'socket.io';

describe('WebSocketTransport - setSocketIOInstance', () => {
  it('should set the Socket.IO instance', () => {
    const transport = createTransport();
    const newMockServer = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    transport.setSocketIOInstance(newMockServer);

    expect((transport as any).io).toBe(newMockServer);
  });

  it('should replace existing Socket.IO instance', () => {
    const transport = createTransport();
    const newMockServer = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    transport.setSocketIOInstance(newMockServer);

    expect((transport as any).io).not.toBe(mockedServer);
  });
});
