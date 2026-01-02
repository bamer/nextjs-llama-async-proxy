/**
 * Helper functions and scenarios for llama status tests
 */

import { renderHook, act } from '@testing-library/react';
import { mockWebsocketServer } from './llama-status-mock-setup';
import { renderLlamaStatusHook, sendStatusMessage, sendNonStatusMessage, getMessageHandler, getSocketHandler, setupMockSocket, expectInitialState, expectInitialStatusRequest } from '../test-utils/llama-status.test-utils';
import * as mocks from './llama-status-test-data';

export const scenarioInitialState = () => { const { result } = renderLlamaStatusHook(); expectInitialState(result); };
export const scenarioHandleNullStatusData = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockNullStatusData); expect(result.current.isLoading).toBe(true); };
export const scenarioHandleUndefinedStatusData = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockUndefinedStatusData); expect(result.current.isLoading).toBe(true); };
export const scenarioHandleNullModelsArray = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithNullModels); expect(result.current.isLoading).toBe(false); expect(result.current.models).toEqual([]); };
export const scenarioHandleUndefinedModelsArray = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithUndefinedModels); expect(result.current.isLoading).toBe(false); expect(result.current.models).toEqual([]); };
export const scenarioHandleNullStartedAt = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithNullStartedAt); expect(result.current.startedAt).toBeNull(); };
export const scenarioHandleLlamaStatusMessages = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockRunningStatus); expect(result.current.status).toBe('running'); expect(result.current.models).toEqual([{ id: '1', name: 'Model 1' }]); expect(result.current.isLoading).toBe(false); };
export const scenarioHandleNonLlamaStatusMessages = () => { const { result } = renderLlamaStatusHook(); sendNonStatusMessage('metrics', { cpu: 50 }); sendNonStatusMessage('models', []); sendNonStatusMessage('logs', []); expect(result.current.status).toBe('initial'); expect(result.current.isLoading).toBe(true); };
export const scenarioHandleMessagesFromSocket = () => { setupMockSocket(); const { result } = renderLlamaStatusHook(); const h = getSocketHandler(); act(() => { if (h) h({ data: mocks.mockRunningStatus }); }); expect(result.current.status).toBe('running'); expect(result.current.isLoading).toBe(false); };
export const scenarioHandleErrorStatus = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockErrorStatus); expect(result.current.status).toBe('error'); expect(result.current.lastError).toBe('Connection failed'); expect(result.current.retries).toBe(3); };
export const scenarioHandleNullError = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithNullError); expect(result.current.lastError).toBeNull(); };
export const scenarioHandleUndefinedError = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithUndefinedError); expect(result.current.lastError).toBeUndefined(); };
export const scenarioTransitionFromInitialToRunning = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockRunningStatus); expect(result.current.status).toBe('running'); expect(result.current.isLoading).toBe(false); };
export const scenarioTransitionThroughMultipleStatusChanges = () => { const { result } = renderLlamaStatusHook(); mocks.mockStatusTransitionSequence.forEach((sd: unknown) => sendStatusMessage(sd)); expect(result.current.status).toBe('stopped'); };
export const scenarioSetLoadingFalseWhenReceivingStatus = () => { const { result } = renderLlamaStatusHook(); expect(result.current.isLoading).toBe(true); sendStatusMessage(mocks.mockRunningStatus); expect(result.current.isLoading).toBe(false); };
export const scenarioRemainLoadingUntilStatusReceived = () => { const { result } = renderLlamaStatusHook(); act(() => { sendNonStatusMessage('metrics', {}); sendNonStatusMessage('models', []); }); expect(result.current.isLoading).toBe(true); };
export const scenarioCleanupEventListenersOnUnmount = () => { const { unmount } = renderLlamaStatusHook(); expect(mockWebsocketServer.on).toHaveBeenCalled(); unmount(); expect(mockWebsocketServer.off).toHaveBeenCalled(); };
export const scenarioNotCallSendMessageAfterUnmount = () => { const { unmount } = renderLlamaStatusHook(); unmount(); expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus'); };
export const scenarioNotLeakMemoryWithFrequentRemounts = () => { for (let i = 0; i < 100; i++) { const { unmount } = renderLlamaStatusHook(); unmount(); } expect(mockWebsocketServer.on.mock.calls.length).toBeLessThan(200); };
export const scenarioHandleRapidStatusUpdatesWithoutMemoryIssues = () => { const { result } = renderLlamaStatusHook(); const rapidUpdates = mocks.createRapidStatusUpdates(1000); act(() => { rapidUpdates.forEach((sd: unknown) => sendStatusMessage(sd)); }); expect(result.current.status).toBe('running'); };
export const scenarioHandleZeroUptime = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithZeroUptime); expect(result.current.uptime).toBe(0); };
export const scenarioHandleNegativeUptime = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithNegativeUptime); expect(result.current.uptime).toBe(-100); };
export const scenarioHandleVeryLargeUptime = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithMaxUptime); expect(result.current.uptime).toBe(Number.MAX_SAFE_INTEGER); };
export const scenarioHandleZeroRetries = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockRunningStatus); expect(result.current.retries).toBe(0); };
export const scenarioHandleHighRetryCounts = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithHighRetries); expect(result.current.retries).toBe(1000); };
export const scenarioHandleEmptyModelsArray = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithEmptyModels); expect(result.current.models).toEqual([]); };
export const scenarioHandleModelsWithNullEntries = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithNullModelEntries); expect(result.current.models).toEqual([null, { id: '1', name: 'Model 1' }, null]); };
export const scenarioHandleVeryLargeModelsArray = () => { const { result } = renderLlamaStatusHook(); const largeModelsStatus = mocks.createMockStatusWithLargeModels(10000); sendStatusMessage(largeModelsStatus); expect(result.current.models).toHaveLength(10000); };
export const scenarioHandleMessagesWithSpecialCharactersInError = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithSpecialChars); expect(result.current.lastError).toBe('Error: <script>alert("xss")</script> & "quotes"'); };
export const scenarioHandleUnicodeInStatusData = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockStatusWithUnicode); expect(result.current.models[0].name).toBe('模型 🚀 测试'); expect(result.current.lastError).toBe('错误'); };
export const scenarioHandleMalformedMessages = () => { const { result } = renderLlamaStatusHook(); const mh = getMessageHandler(); act(() => { if (mh) mocks.mockMalformedMessages.forEach((msg: unknown) => mh(msg)); }); expect(result.current.status).toBe('initial'); expect(result.current.isLoading).toBe(true); };
export const scenarioHandleMissingDataProperty = () => { const { result } = renderLlamaStatusHook(); const mh = getMessageHandler(); act(() => { if (mh) mh({ type: 'llama_status' }); }); expect(result.current.status).toBe('initial'); };
export const scenarioHandlePartialDataUpdates = () => { const { result } = renderLlamaStatusHook(); sendStatusMessage(mocks.mockPartialStatusData); expect(result.current.status).toBe('running'); expect(result.current.isLoading).toBe(false); };
export const scenarioHandleNullSocket = () => { mockWebsocketServer.getSocket.mockReturnValueOnce(null); const { result } = renderLlamaStatusHook(); expect(result.current.status).toBe('initial'); };
export const scenarioHandleUndefinedSocket = () => { mockWebsocketServer.getSocket.mockReturnValueOnce(undefined as unknown); const { result } = renderLlamaStatusHook(); expect(result.current.status).toBe('initial'); };
export const scenarioHandleSocketWithNoOnMethod = () => { mockWebsocketServer.getSocket.mockReturnValueOnce({} as unknown); const { result } = renderLlamaStatusHook(); expect(result.current.status).toBe('initial'); };
export const scenarioRequestInitialStatusOnMount = () => { renderLlamaStatusHook(); expectInitialStatusRequest(); };
export const scenarioRequestInitialStatusOnlyOnceOnMount = () => { renderLlamaStatusHook(); expect(mockWebsocketServer.sendMessage).toHaveBeenCalledTimes(1); };
