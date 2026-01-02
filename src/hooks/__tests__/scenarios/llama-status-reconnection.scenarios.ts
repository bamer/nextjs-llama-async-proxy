/**
 * Test scenarios for llama status reconnection and state transitions
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../../useLlamaStatus';
import { renderLlamaStatusHook, getMessageHandler } from '../test-utils/llama-status.test-utils';
import {
  mockRunningStatus,
  mockStartingStatus,
  mockStoppedStatus,
  createRapidStatusUpdates,
} from '../mocks/llama-status.mocks';
import * as websocketClientModule from '@/lib/websocket-client';

const ws = websocketClientModule.websocketServer as unknown as {
  on: jest.Mock;
  off: jest.Mock;
  sendMessage: jest.Mock;
  getSocket: jest.Mock;
};

export const scenarioTransitionFromInitialToRunning = () => {
  const { result } = renderLlamaStatusHook();
  const h = getMessageHandler();
  act(() => { if (h) h({ type: 'llama_status', data: mockRunningStatus }); });
  expect(result.current.status).toBe('running');
  expect(result.current.isLoading).toBe(false);
};

export const scenarioTransitionThroughMultipleStatusChanges = () => {
  const { result } = renderLlamaStatusHook();
  const h = getMessageHandler();
  act(() => { if (h) h({ type: 'llama_status', data: mockStartingStatus }); });
  expect(result.current.status).toBe('starting');
  act(() => {
    if (h) h({
      type: 'llama_status',
      data: { status: 'running', models: [{ id: '1' }], lastError: null, retries: 0, uptime: 100, startedAt: '2024-01-01T00:00:00Z' },
    });
  });
  expect(result.current.status).toBe('running');
  act(() => { if (h) h({ type: 'llama_status', data: mockStoppedStatus }); });
  expect(result.current.status).toBe('stopped');
};

export const scenarioSetLoadingToFalseWhenReceivingStatus = () => {
  const { result } = renderLlamaStatusHook();
  expect(result.current.isLoading).toBe(true);
  const h = getMessageHandler();
  act(() => { if (h) h({ type: 'llama_status', data: mockRunningStatus }); });
  expect(result.current.isLoading).toBe(false);
};

export const scenarioRemainLoadingUntilStatusReceived = () => {
  const { result } = renderLlamaStatusHook();
  const h = getMessageHandler();
  act(() => {
    if (h) {
      h({ type: 'metrics', data: {} });
      h({ type: 'models', data: [] });
    }
  });
  expect(result.current.isLoading).toBe(true);
};

export const scenarioNotLeakMemoryWithFrequentRemounts = () => {
  for (let i = 0; i < 100; i++) {
    const { unmount } = renderLlamaStatusHook();
    unmount();
  }
  expect(ws.on.mock.calls.length).toBeLessThan(200);
};

export const scenarioHandleRapidStatusUpdatesWithoutMemoryIssues = () => {
  const { result } = renderLlamaStatusHook();
  const h = getMessageHandler();
  const updates = createRapidStatusUpdates(1000);
  act(() => {
    updates.forEach((statusData) => {
      if (h) h({ type: 'llama_status', data: statusData });
    });
  });
  expect(result.current.status).toBe('running');
};

export const reconnectionScenarios = {
  statusTransitions: {
    'should transition from initial to running': scenarioTransitionFromInitialToRunning,
    'should transition through multiple status changes': scenarioTransitionThroughMultipleStatusChanges,
  },
  loadingState: {
    'should set loading to false when receiving status': scenarioSetLoadingToFalseWhenReceivingStatus,
    'should remain loading until status received': scenarioRemainLoadingUntilStatusReceived,
  },
  memoryLeaks: {
    'should not leak memory with frequent remounts': scenarioNotLeakMemoryWithFrequentRemounts,
    'should handle rapid status updates without memory issues': scenarioHandleRapidStatusUpdatesWithoutMemoryIssues,
  },
};
