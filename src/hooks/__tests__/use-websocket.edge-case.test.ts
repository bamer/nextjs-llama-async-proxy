/**
 * Comprehensive edge case tests for useWebSocket hook
 * Testing for null/undefined inputs, error states, loading states,
 * concurrent calls, cleanup on unmount, memory leaks, and edge cases
 */

import { connectionStatesScenarios } from './scenarios/websocket-connection-states.scenarios';
import { connectionCleanupScenarios } from './scenarios/websocket-connection-cleanup.scenarios';
import { messageHandlingScenarios } from './scenarios/websocket-message-handling.scenarios';
import { sendMessageScenarios } from './scenarios/websocket-send-message.scenarios';
import { messageEdgeCasesScenarios } from './scenarios/websocket-message-edge-cases.scenarios';
import { errorHandlingScenarios } from './scenarios/websocket-error-handling.scenarios';
import { memoryLeaksScenarios } from './scenarios/websocket-memory-leaks.scenarios';
import { requestsAndSocketIdScenarios } from './scenarios/websocket-requests-socket-id.scenarios';

describe('useWebSocket - Edge Cases', () => {
  connectionStatesScenarios();
  connectionCleanupScenarios();
  messageHandlingScenarios();
  sendMessageScenarios();
  messageEdgeCasesScenarios();
  errorHandlingScenarios();
  memoryLeaksScenarios();
  requestsAndSocketIdScenarios();
});
