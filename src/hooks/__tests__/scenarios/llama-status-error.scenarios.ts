/**
 * Test scenarios for llama status error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../../useLlamaStatus';
import { renderLlamaStatusHook, getMessageHandler } from '../test-utils/llama-status.test-utils';
import {
  mockNullStatusData,
  mockUndefinedStatusData,
  mockStatusWithNullModels,
  mockStatusWithUndefinedModels,
  mockStatusWithNullStartedAt,
  mockStatusWithNullError,
  mockStatusWithUndefinedError,
  mockErrorStatus,
  mockStatusWithSpecialChars,
  mockStatusWithUnicode,
  mockMalformedMessages,
  mockPartialStatusData,
} from '../mocks/llama-status.mocks';

const sendStatusMsg = (data: unknown, result: any) => {
  const h = getMessageHandler();
  act(() => { if (h) h({ type: 'llama_status', data }); });
  return result;
};

export const scenarioHandleNullStatusData = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockNullStatusData, result);
  expect(result.current.isLoading).toBe(true);
};

export const scenarioHandleUndefinedStatusData = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockUndefinedStatusData, result);
  expect(result.current.isLoading).toBe(true);
};

export const scenarioHandleNullModelsArray = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithNullModels, result);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.models).toEqual([]);
};

export const scenarioHandleUndefinedModelsArray = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithUndefinedModels, result);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.models).toEqual([]);
};

export const scenarioHandleNullStartedAt = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithNullStartedAt, result);
  expect(result.current.startedAt).toBeNull();
};

export const scenarioHandleErrorStatus = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockErrorStatus, result);
  expect(result.current.status).toBe('error');
  expect(result.current.lastError).toBe('Connection failed');
  expect(result.current.retries).toBe(3);
};

export const scenarioHandleNullError = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithNullError, result);
  expect(result.current.lastError).toBeNull();
};

export const scenarioHandleUndefinedError = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithUndefinedError, result);
  expect(result.current.lastError).toBeUndefined();
};

export const scenarioHandleSpecialCharactersInError = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithSpecialChars, result);
  expect(result.current.lastError).toBe(
    'Error: <script>alert("xss")</script> & "quotes"'
  );
};

export const scenarioHandleUnicodeInStatusData = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockStatusWithUnicode, result);
  expect(result.current.models[0].name).toBe('模型 🚀 测试');
  expect(result.current.lastError).toBe('错误');
};

export const scenarioHandleMalformedMessages = () => {
  const { result } = renderLlamaStatusHook();
  const h = getMessageHandler();
  act(() => {
    mockMalformedMessages.forEach((msg) => {
      if (typeof msg === 'object' && msg !== null && h) h(msg);
    });
  });
  expect(result.current.status).toBe('initial');
  expect(result.current.isLoading).toBe(true);
};

export const scenarioHandleMissingDataProperty = () => {
  const { result } = renderLlamaStatusHook();
  const h = getMessageHandler();
  act(() => { if (h) h({ type: 'llama_status' }); });
  expect(result.current.status).toBe('initial');
};

export const scenarioHandlePartialDataUpdates = () => {
  const { result } = renderLlamaStatusHook();
  sendStatusMsg(mockPartialStatusData, result);
  expect(result.current.status).toBe('running');
  expect(result.current.isLoading).toBe(false);
};

export const errorScenarios = {
  nullUndefinedHandling: {
    'should handle null status data': scenarioHandleNullStatusData,
    'should handle undefined status data': scenarioHandleUndefinedStatusData,
    'should handle null models array': scenarioHandleNullModelsArray,
    'should handle undefined models array': scenarioHandleUndefinedModelsArray,
    'should handle null startedAt': scenarioHandleNullStartedAt,
  },
  errorStates: {
    'should handle error status': scenarioHandleErrorStatus,
    'should handle null error': scenarioHandleNullError,
    'should handle undefined error': scenarioHandleUndefinedError,
  },
  edgeCaseScenarios: {
    'should handle messages with special characters in error': scenarioHandleSpecialCharactersInError,
    'should handle unicode in status data': scenarioHandleUnicodeInStatusData,
    'should handle malformed messages': scenarioHandleMalformedMessages,
    'should handle missing data property': scenarioHandleMissingDataProperty,
    'should handle partial data updates': scenarioHandlePartialDataUpdates,
  },
};
