import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';

// Import scenario collections
import { connectionScenarios } from './websocket-reconnection-connection.scenarios';
import { timingScenarios } from './websocket-reconnection-timing.scenarios';
import { cleanupScenarios } from './websocket-reconnection-cleanup.scenarios';
import {
  mockAddLog,
  mockSetMetrics,
  mockSetModels,
  mockSetLogs,
  mockWebSocketServer,
  contextState,
} from './websocket-reconnection-shared';

// Mock dependencies
jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');
jest.mock('@/providers/websocket-provider');

describe('useWebSocket Reconnection Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAddLog.mockClear();
    mockSetMetrics.mockClear();
    mockSetModels.mockClear();
    mockSetLogs.mockClear();
    // Reset context state
    contextState.isConnected = false;
    contextState.connectionState = 'disconnected';
    contextState.reconnectionAttempts = 0;
    // Clear mock calls
    mockWebSocketServer.connect.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Connection scenarios
  Object.entries(connectionScenarios).forEach(([name, scenario]) => {
    it(name, scenario);
  });

  // Timing scenarios
  Object.entries(timingScenarios).forEach(([name, scenario]) => {
    it(name, scenario);
  });

  // Cleanup scenarios
  Object.entries(cleanupScenarios).forEach(([name, scenario]) => {
    it(name, scenario);
  });
});
