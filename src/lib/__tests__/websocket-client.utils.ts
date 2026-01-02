import { WebSocketClient } from '@/lib/websocket-client';
import { io, Socket } from 'socket.io-client';

jest.mock('socket.io-client');

const mockedIo = io as jest.Mock;
const mockedSocket = {
  connected: false,
  id: 'test-socket-id',
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
} as unknown as Socket;

export function setupClient(): WebSocketClient {
  mockedSocket.connected = false;
  mockedSocket.id = 'test-socket-id';
  mockedIo.mockReturnValue(mockedSocket);

  const client = new WebSocketClient();

  (global as any).window = {
    location: {
      origin: 'http://localhost:3000',
    },
  };

  return client;
}

export function setupConnectedClient(): WebSocketClient {
  const client = setupClient();
  mockedSocket.connected = true;
  (client as any).socket = mockedSocket;
  return client;
}

export function getSocketMock(): Socket {
  return mockedSocket as Socket;
}

export function getIoMock(): jest.Mock {
  return mockedIo;
}

export function simulateConnectEvent(client: WebSocketClient): void {
  const onMock = mockedSocket.on as jest.Mock;
  const connectHandler = onMock.mock.calls.find(
    (call) => call[0] === 'connect'
  )?.[1];

  if (connectHandler) {
    connectHandler();
  }
}

export function simulateMessageEvent(
  client: WebSocketClient,
  eventName: string,
  data: unknown
): void {
  const onMock = mockedSocket.on as jest.Mock;
  const handler = onMock.mock.calls.find(
    (call) => call[0] === eventName
  )?.[1];

  if (handler) {
    handler(data);
  }
}

export const EXPECTED_CONNECTION_OPTIONS = {
  path: '/llamaproxws',
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
};
