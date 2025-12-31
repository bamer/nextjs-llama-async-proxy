/**
 * WebSocket client types and constants
 */

export interface QueuedMessage {
  event: string;
  data?: unknown;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export const WEBSOCKET_CONFIG: import('socket.io-client').ManagerOptions &
  import('socket.io-client').SocketOptions = {
  path: '/llamaproxws',
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  forceNew: false,
  multiplex: true,
  randomizationFactor: 1,
  autoConnect: false,
  parser: undefined as any,
};
