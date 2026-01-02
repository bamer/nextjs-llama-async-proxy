/**
 * WebSocket message scenarios for useWebSocket hook
 * Tests message handling, sendMessage function, and message-related edge cases
 * Refactored: Splits code into separate files for better organization
 */

import { sendMessageScenarios } from './websocket-message-send.scenarios';
import { messageReceiveScenarios } from './websocket-message-receive.scenarios';
import { messageParseScenarios } from './websocket-message-parse.scenarios';

export const messageScenarios = () => {
  sendMessageScenarios();
  messageReceiveScenarios();
  messageParseScenarios();
};
