import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../../useSettings';

const DEFAULT_SETTINGS = { theme: 'system', logLevel: 'info', maxConcurrentModels: 3, autoUpdate: true, notificationsEnabled: true, refreshInterval: 2 };

export const scenarioHandleNullInUpdateSettings = () => {
  const { result } = renderHook(() => useSettings());
  act(() => (result.current.updateSettings as any)(null));
  expect(result.current.settings).toBeDefined();
};

export const scenarioHandleUndefinedInUpdateSettings = () => {
  const { result } = renderHook(() => useSettings());
  act(() => (result.current.updateSettings as any)(undefined));
  expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
};

export const scenarioHandleSettingsWithInvalidDataTypes = () => {
  const { result } = renderHook(() => useSettings());
  act(() => result.current.updateSettings({ theme: 123 as any, logLevel: true as any }));
  expect(result.current.settings).toBeDefined();
  expect(result.current.settings.theme).toBe(123);
  expect(result.current.settings.logLevel).toBe(true);
};

export const scenarioHandleSettingsWithSpecialCharacters = () => {
  const { result } = renderHook(() => useSettings());
  act(() => (result.current.updateSettings as any)({ theme: '<script>alert("xss")</script>' }));
  expect(result.current.settings.theme).toBe('<script>alert("xss")</script>');
};

export const scenarioHandleSettingsWithUnicodeCharacters = () => {
  const { result } = renderHook(() => useSettings());
  act(() => (result.current.updateSettings as any)({ theme: '主题 🚀 测试' }));
  expect(result.current.settings.theme).toBe('主题 🚀 测试');
};

export const scenarioHandleSettingsWithEmoji = () => {
  const { result } = renderHook(() => useSettings());
  act(() => (result.current.updateSettings as any)({ theme: '🌙 Dark Mode' }));
  expect(result.current.settings.theme).toBe('🌙 Dark Mode');
};

export const scenarioHandleCircularReferenceInSettings = () => {
  const { result } = renderHook(() => useSettings());
  const circularData: any = { theme: 'dark' };
  circularData.self = circularData;
  act(() => (result.current.updateSettings as any)(circularData));
  expect(result.current.settings).toBeDefined();
};

export const scenarioHandleConcurrentUpdatesWithInvalidData = () => {
  const { result } = renderHook(() => useSettings());
  act(() => {
    for (let i = 0; i < 100; i++) {
      result.current.updateSettings({ refreshInterval: i });
      (result.current.updateSettings as any)({ theme: i % 2 === 0 ? 'dark' : 'light' });
    }
  });
  expect(result.current.settings).toBeDefined();
};

export const validationScenarios = {
  nullUndefinedHandling: { 'should handle null in updateSettings': scenarioHandleNullInUpdateSettings, 'should handle undefined in updateSettings': scenarioHandleUndefinedInUpdateSettings },
  errorStates: { 'should handle settings with invalid data types': scenarioHandleSettingsWithInvalidDataTypes },
  edgeCaseScenarios: { 'should handle settings with special characters': scenarioHandleSettingsWithSpecialCharacters, 'should handle settings with unicode characters': scenarioHandleSettingsWithUnicodeCharacters, 'should handle settings with emoji': scenarioHandleSettingsWithEmoji, 'should handle circular reference in settings': scenarioHandleCircularReferenceInSettings, 'should handle concurrent updates with invalid data': scenarioHandleConcurrentUpdatesWithInvalidData },
};
