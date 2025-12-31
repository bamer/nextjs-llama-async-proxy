/**
 * Zustand store selectors and custom hooks
 * Provides fine-grained state access with shallow comparison
 */

import { shallow } from 'zustand/shallow';
import { AppStore } from './types';

// Direct selectors
export const selectModels = (state: AppStore) => state.models;
export const selectActiveModel = (state: AppStore) =>
  state.models.find((model) => model.id === state.activeModelId) || null;
export const selectMetrics = (state: AppStore) => state.metrics;
export const selectLogs = (state: AppStore) => state.logs;
export const selectSettings = (state: AppStore) => state.settings;
export const selectStatus = (state: AppStore) => state.status;
export const selectChartHistory = (state: AppStore) => state.chartHistory;

/**
 * Create a typed shallow selector helper
 */
export function createSelector<T>(selector: (state: AppStore) => T) {
  return selector;
}

/**
 * Custom hooks factory
 * Creates typed hooks with shallow comparison
 */
export function createShallowHook<T>(selector: (state: AppStore) => T) {
  return (useStore: any) => {
    const typedStore = useStore as unknown as <U>(
      sel: (state: AppStore) => U,
      eq?: (a: U, b: U) => boolean
    ) => U;
    return typedStore(selector, shallow);
  };
}
