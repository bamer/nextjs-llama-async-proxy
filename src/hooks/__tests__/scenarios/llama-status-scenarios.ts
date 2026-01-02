/**
 * Test scenario functions for useLlamaStatus hook
 * Provides individual scenario functions that can be composed into test cases
 * Refactored: Splits code into separate files for better organization
 */

// Import all scenario functions from split files
import {
  scenarioInitialState,
  scenarioHandleNullStatusData,
  scenarioHandleUndefinedStatusData,
  scenarioHandleNullModelsArray,
  scenarioHandleUndefinedModelsArray,
  scenarioHandleNullStartedAt,
  scenarioHandleLlamaStatusMessages,
  scenarioHandleNonLlamaStatusMessages,
  scenarioHandleMessagesFromSocket,
  scenarioHandleErrorStatus,
  scenarioHandleNullError,
  scenarioHandleUndefinedError,
  scenarioTransitionFromInitialToRunning,
  scenarioTransitionThroughMultipleStatusChanges,
  scenarioSetLoadingFalseWhenReceivingStatus,
  scenarioRemainLoadingUntilStatusReceived,
  scenarioCleanupEventListenersOnUnmount,
  scenarioNotCallSendMessageAfterUnmount,
  scenarioNotLeakMemoryWithFrequentRemounts,
  scenarioHandleRapidStatusUpdatesWithoutMemoryIssues,
  scenarioHandleZeroUptime,
  scenarioHandleNegativeUptime,
  scenarioHandleVeryLargeUptime,
  scenarioHandleZeroRetries,
  scenarioHandleHighRetryCounts,
  scenarioHandleEmptyModelsArray,
  scenarioHandleModelsWithNullEntries,
  scenarioHandleVeryLargeModelsArray,
  scenarioHandleMessagesWithSpecialCharactersInError,
  scenarioHandleUnicodeInStatusData,
  scenarioHandleMalformedMessages,
  scenarioHandleMissingDataProperty,
  scenarioHandlePartialDataUpdates,
  scenarioHandleNullSocket,
  scenarioHandleUndefinedSocket,
  scenarioHandleSocketWithNoOnMethod,
  scenarioRequestInitialStatusOnMount,
  scenarioRequestInitialStatusOnlyOnceOnMount,
} from './llama-status-helper-functions';

// Re-export all scenario functions for backward compatibility
export { scenarioInitialState };
export { scenarioHandleNullStatusData };
export { scenarioHandleUndefinedStatusData };
export { scenarioHandleNullModelsArray };
export { scenarioHandleUndefinedModelsArray };
export { scenarioHandleNullStartedAt };
export { scenarioHandleLlamaStatusMessages };
export { scenarioHandleNonLlamaStatusMessages };
export { scenarioHandleMessagesFromSocket };
export { scenarioHandleErrorStatus };
export { scenarioHandleNullError };
export { scenarioHandleUndefinedError };
export { scenarioTransitionFromInitialToRunning };
export { scenarioTransitionThroughMultipleStatusChanges };
export { scenarioSetLoadingFalseWhenReceivingStatus };
export { scenarioRemainLoadingUntilStatusReceived };
export { scenarioCleanupEventListenersOnUnmount };
export { scenarioNotCallSendMessageAfterUnmount };
export { scenarioNotLeakMemoryWithFrequentRemounts };
export { scenarioHandleRapidStatusUpdatesWithoutMemoryIssues };
export { scenarioHandleZeroUptime };
export { scenarioHandleNegativeUptime };
export { scenarioHandleVeryLargeUptime };
export { scenarioHandleZeroRetries };
export { scenarioHandleHighRetryCounts };
export { scenarioHandleEmptyModelsArray };
export { scenarioHandleModelsWithNullEntries };
export { scenarioHandleVeryLargeModelsArray };
export { scenarioHandleMessagesWithSpecialCharactersInError };
export { scenarioHandleUnicodeInStatusData };
export { scenarioHandleMalformedMessages };
export { scenarioHandleMissingDataProperty };
export { scenarioHandlePartialDataUpdates };
export { scenarioHandleNullSocket };
export { scenarioHandleUndefinedSocket };
export { scenarioHandleSocketWithNoOnMethod };
export { scenarioRequestInitialStatusOnMount };
export { scenarioRequestInitialStatusOnlyOnceOnMount };

// Scenario Collections
export const initialStateScenarios = { initialState: scenarioInitialState };
export const nullUndefinedScenarios = { nullStatusData: scenarioHandleNullStatusData, undefinedStatusData: scenarioHandleUndefinedStatusData, nullModelsArray: scenarioHandleNullModelsArray, undefinedModelsArray: scenarioHandleUndefinedModelsArray, nullStartedAt: scenarioHandleNullStartedAt };
export const messageHandlingScenarios = { llamaStatusMessages: scenarioHandleLlamaStatusMessages, nonLlamaStatusMessages: scenarioHandleNonLlamaStatusMessages, messagesFromSocket: scenarioHandleMessagesFromSocket };
export const errorStatesScenarios = { errorStatus: scenarioHandleErrorStatus, nullError: scenarioHandleNullError, undefinedError: scenarioHandleUndefinedError };
export const statusTransitionScenarios = { initialToRunning: scenarioTransitionFromInitialToRunning, multipleStatusChanges: scenarioTransitionThroughMultipleStatusChanges };
export const loadingStateScenarios = { loadingFalseOnStatus: scenarioSetLoadingFalseWhenReceivingStatus, remainLoadingUntilStatus: scenarioRemainLoadingUntilStatusReceived };
export const cleanupScenarios = { eventListenersCleanup: scenarioCleanupEventListenersOnUnmount, noSendMessageAfterUnmount: scenarioNotCallSendMessageAfterUnmount };
export const memoryLeakScenarios = { frequentRemounts: scenarioNotLeakMemoryWithFrequentRemounts, rapidStatusUpdates: scenarioHandleRapidStatusUpdatesWithoutMemoryIssues };
export const uptimeRetriesScenarios = { zeroUptime: scenarioHandleZeroUptime, negativeUptime: scenarioHandleNegativeUptime, largeUptime: scenarioHandleVeryLargeUptime, zeroRetries: scenarioHandleZeroRetries, highRetries: scenarioHandleHighRetryCounts };
export const modelsArrayScenarios = { emptyModels: scenarioHandleEmptyModelsArray, nullModelEntries: scenarioHandleModelsWithNullEntries, largeModelsArray: scenarioHandleVeryLargeModelsArray };
export const edgeCaseScenarios = { specialCharsInError: scenarioHandleMessagesWithSpecialCharactersInError, unicodeInStatusData: scenarioHandleUnicodeInStatusData, malformedMessages: scenarioHandleMalformedMessages, missingDataProperty: scenarioHandleMissingDataProperty, partialDataUpdates: scenarioHandlePartialDataUpdates };
export const socketEventsScenarios = { nullSocket: scenarioHandleNullSocket, undefinedSocket: scenarioHandleUndefinedSocket, socketWithNoOnMethod: scenarioHandleSocketWithNoOnMethod };
export const initialStatusRequestScenarios = { requestOnMount: scenarioRequestInitialStatusOnMount, requestOnceOnMount: scenarioRequestInitialStatusOnlyOnceOnMount };
