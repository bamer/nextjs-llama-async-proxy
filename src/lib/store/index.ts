/**
 * Zustand store for global application state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { AppStore } from './types';
import { initialState } from './initial-state';
import {
  addChartDataPoint,
  rebuildChartHistoryFromMetrics,
  trimChartDataPoints,
  createEmptyChartHistory,
  getInitialStatus,
} from './actions';

// Create store - No localStorage persistence
// All data is transient and loaded from API on demand
const useAppStore = create<AppStore>()(
  immer((set) => ({
    ...initialState,

    // Model actions
    setModels: (models) => set({ models }),
    addModel: (model) =>
      set((state) => ({
        models: [...state.models, model],
      })),
    updateModel: (id, updates) =>
      set((state) => {
        state.models = state.models.map((model) =>
          model.id === id ? { ...model, ...updates } : model
        );
      }),
    removeModel: (id) =>
      set((state) => {
        state.models = state.models.filter((model) => model.id !== id);
        if (state.activeModelId === id) {
          state.activeModelId = null;
        }
      }),
    setActiveModel: (id) => set({ activeModelId: id }),

    // Metrics and logs
    setMetrics: (metrics) => set({ metrics }),
    addLog: (log) =>
      set((state) => ({
        logs: [log, ...state.logs].slice(0, 100),
      })),
    setLogs: (logs) => set({ logs }),
    clearLogs: () => set({ logs: [] }),

    // Server status
    setLlamaServerStatus: (status) =>
      set((state) => {
        state.status = { ...state.status, llamaServerStatus: status };
      }),

    // Chart data
    addChartData: (type, value) =>
      set((state) => {
        state.chartHistory = addChartDataPoint(state.chartHistory, type, value);
      }),
    setChartData: (data) => set(() => ({ chartHistory: data })),
    trimChartData: (maxPoints = 200) =>
      set((state) => {
        state.chartHistory = trimChartDataPoints(state.chartHistory, maxPoints);
      }),
    clearChartData: () => set(() => ({ chartHistory: createEmptyChartHistory() })),
    rebuildChartHistory: (metrics) =>
      set(() => ({
        chartHistory: rebuildChartHistoryFromMetrics(metrics),
      })),

    // Settings
    updateSettings: (updates) =>
      set((state) => {
        state.settings = { ...state.settings, ...updates };
      }),

    // Loading and error states
    setLoading: (isLoading) =>
      set((state) => {
        state.status = { ...state.status, isLoading };
      }),
    setError: (error) =>
      set((state) => {
        state.status = { ...state.status, error };
      }),
    clearError: () =>
      set((state) => {
        state.status = getInitialStatus();
      }),
  }))
);

// Export store
export const useStore = useAppStore;
export const getState = useAppStore.getState;
export type { AppStore } from './types';

// Type assertion for shallow comparison
const storeWithShallow = useAppStore as unknown as <T>(
  selector: (state: AppStore) => T,
  equalityFn?: (a: T, b: T) => boolean
) => T;

// Custom hooks with shallow comparison
export const useModels = () => storeWithShallow((state) => state.models, shallow);
export const useMetrics = () => storeWithShallow((state) => state.metrics, shallow);
export const useChartHistory = () => storeWithShallow((state) => state.chartHistory, shallow);
export const useLlamaServerStatus = () =>
  storeWithShallow((state) => state.status.llamaServerStatus, shallow);
