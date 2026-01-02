/**
 * Mock setup for llama status scenarios
 * Provides mock WebSocket server configuration
 */

import * as websocketClientModule from '@/lib/websocket-client';

export const mockWebsocketServer = websocketClientModule.websocketServer as unknown as {
  on: jest.Mock;
  off: jest.Mock;
  sendMessage: jest.Mock;
  getSocket: jest.Mock;
};
