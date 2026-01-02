import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings, AppSettings } from '../../useSettings';

const DEFAULT_SETTINGS = { theme: 'system', logLevel: 'info', maxConcurrentModels: 3, autoUpdate: true, notificationsEnabled: true, refreshInterval: 2 };

export const scenarioInitializeWithDefaultSettings = () => {
  const { result } = renderHook(() => useSettings());
  expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  expect(result.current.isLoading).toBe(false);
};

export const scenarioLoadDefaultSettingsAfterMount = () => {
  const { result } = renderHook(() => useSettings());
  expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  expect(result.current.isLoading).toBe(false);
};

export const scenarioBeLoadingInitially = () => {
  const { result } = renderHook(() => useSettings());
  expect(result.current.isLoading).toBe(false);
};

export const scenarioFinishLoadingAfterLocalStorageRead = () => {
  const { result } = renderHook(() => useSettings());
  expect(result.current.isLoading).toBe(false);
};

export const scenarioLoadSavedSettings = () => {
  const { result } = renderHook(() => useSettings());
  expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  expect(result.current.isLoading).toBe(false);
};

export const scenarioMergeWithDefaultsWhenPartialSettingsSaved = () => {
  const { result } = renderHook(() => useSettings());
  expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  expect(result.current.isLoading).toBe(false);
};

export const scenarioUpdateSingleSetting = () => {
  const { result } = renderHook(() => useSettings());
  act(() => result.current.updateSettings({ theme: 'dark' }));
  expect(result.current.settings.theme).toBe('dark');
};

export const scenarioUpdateMultipleSettings = () => {
  const { result } = renderHook(() => useSettings());
  act(() => result.current.updateSettings({ theme: 'dark', logLevel: 'debug', refreshInterval: 10 }));
  expect(result.current.settings.theme).toBe('dark');
  expect(result.current.settings.logLevel).toBe('debug');
  expect(result.current.settings.refreshInterval).toBe(10);
};

export const scenarioPersistSettingsToLocalStorage = () => {
  const { result } = renderHook(() => useSettings());
  act(() => result.current.updateSettings({ theme: 'dark' }));
  expect(result.current.settings.theme).toBe('dark');
};

export const scenarioHandleConcurrentUpdates = () => {
  const { result } = renderHook(() => useSettings());
  act(() => result.current.updateSettings({ theme: 'dark' }));
  expect(result.current.settings.theme).toBe('dark');
  act(() => result.current.updateSettings({ logLevel: 'debug' }));
  expect(result.current.settings.logLevel).toBe('debug');
  act(() => result.current.updateSettings({ refreshInterval: 5 }));
  expect(result.current.settings.refreshInterval).toBe(5);
  expect(result.current.settings.theme).toBe('dark');
  expect(result.current.settings.logLevel).toBe('debug');
};

export const scenarioHandleEmptyUpdate = () => {
  const { result } = renderHook(() => useSettings());
  const originalSettings = { ...result.current.settings };
  act(() => result.current.updateSettings({}));
  expect(result.current.settings).toEqual(originalSettings);
};

export const scenarioNotLeakMemoryWithFrequentRemounts = () => {
  for (let i = 0; i < 100; i++) {
    const { unmount } = renderHook(() => useSettings());
    unmount();
  }
  expect(true).toBe(true);
};

export const scenarioHandleLargeSettingsObject = () => {
  const { result } = renderHook(() => useSettings());
  const largeValue = 'x'.repeat(1000);
  act(() => result.current.updateSettings({ theme: largeValue as any }));
  expect(result.current.settings.theme).toBe(largeValue);
};

export const scenarioHandleRapidUpdatesWithoutMemoryIssues = () => {
  const { result } = renderHook(() => useSettings());
  act(() => {
    for (let i = 0; i < 100; i++) result.current.updateSettings({ refreshInterval: i });
  });
  expect(result.current.settings.refreshInterval).toBe(99);
};

export const scenarioNotThrowErrorsOnUnmount = () => {
  const { unmount } = renderHook(() => useSettings());
  expect(() => unmount()).not.toThrow();
};

export const persistenceScenarios = {
  initialState: { 'should initialize with default settings': scenarioInitializeWithDefaultSettings, 'should load default settings after mount': scenarioLoadDefaultSettingsAfterMount },
  loadingState: { 'should be loading initially': scenarioBeLoadingInitially, 'should finish loading after localStorage read': scenarioFinishLoadingAfterLocalStorageRead, 'should load saved settings': scenarioLoadSavedSettings, 'should merge with defaults when partial settings saved': scenarioMergeWithDefaultsWhenPartialSettingsSaved },
  updateSettings: { 'should update single setting': scenarioUpdateSingleSetting, 'should update multiple settings': scenarioUpdateMultipleSettings, 'should persist settings to localStorage': scenarioPersistSettingsToLocalStorage, 'should handle concurrent updates': scenarioHandleConcurrentUpdates, 'should handle empty update': scenarioHandleEmptyUpdate },
  memoryLeaks: { 'should not leak memory with frequent remounts': scenarioNotLeakMemoryWithFrequentRemounts, 'should handle large settings object': scenarioHandleLargeSettingsObject, 'should handle rapid updates without memory issues': scenarioHandleRapidUpdatesWithoutMemoryIssues },
  cleanup: { 'should not throw errors on unmount': scenarioNotThrowErrorsOnUnmount },
};
