import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { APP_CONFIG } from "@/config/app.config";
import { ThemeMode } from "@/contexts/ThemeContext";

// Define store types
interface ChartDataPoint {
  time: string;
  displayTime: string;
  value: number;
}

interface ChartHistory {
  cpu: ChartDataPoint[];
  memory: ChartDataPoint[];
  requests: ChartDataPoint[];
  gpuUtil: ChartDataPoint[];
  power: ChartDataPoint[];
}

interface AppState {
  models: ModelConfig[];
  activeModelId: string | null;
  metrics: SystemMetrics | null;
  logs: LogEntry[];
  settings: {
    theme: ThemeMode;
    notifications: boolean;
    autoRefresh: boolean;
  };
  status: {
    isLoading: boolean;
    error: string | null;
    llamaServerStatus: 'running' | 'stopped' | 'unknown';
  };
  chartHistory: ChartHistory;
}

interface ChartHistoryData {
  cpu: ChartDataPoint[];
  memory: ChartDataPoint[];
  requests: ChartDataPoint[];
  gpuUtil: ChartDataPoint[];
  power: ChartDataPoint[];
}

interface AppActions {
  setModels: (models: ModelConfig[]) => void;
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  setActiveModel: (id: string | null) => void;
  setMetrics: (metrics: SystemMetrics) => void;
  addLog: (log: LogEntry) => void;
  setLogs: (logs: LogEntry[]) => void;
  clearLogs: () => void;
  setLlamaServerStatus: (status: 'running' | 'stopped' | 'unknown') => void;
  addChartData: (type: keyof ChartHistory, value: number) => void;
  setChartData: (data: ChartHistory) => void;
  trimChartData: (maxPoints?: number) => void;
  clearChartData: () => void;
  rebuildChartHistory: (metrics: SystemMetrics) => void;
  updateSettings: (updates: Partial<AppState['settings']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type AppStore = AppState & AppActions;



// Initial state
const initialState: AppState = {
  models: [],
  activeModelId: null,
  metrics: null,
  logs: [],
  settings: {
    theme: APP_CONFIG.theme.default as ThemeMode,
    notifications: true,
    autoRefresh: true,
  },
  status: {
    isLoading: false,
    error: null,
    llamaServerStatus: 'unknown',
  },
  chartHistory: {
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
  },
};

// Create store - No localStorage persistence
// All data is transient and loaded from API on demand
const useAppStore = create<AppStore>()(
  immer((set) => ({
    ...initialState,

    // Actions - Optimized to only update specific fields to minimize re-renders
    setModels: (models) => set({ models }),
    addModel: (model) => set((state) => ({ models: [...state.models, model] })),
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
    setMetrics: (metrics) => set({ metrics }), // Only updates metrics field
    addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 100) })),
    setLogs: (logs) => set({ logs }),
    clearLogs: () => set({ logs: [] }),
    setLlamaServerStatus: (status) =>
      set((state) => {
        state.status = { ...state.status, llamaServerStatus: status };
      }),
    updateSettings: (updates) =>
      set((state) => {
        state.settings = { ...state.settings, ...updates };
      }),
    setLoading: (isLoading) => set((state) => {
      state.status = { ...state.status, isLoading };
    }),
    setError: (error) => set((state) => {
      state.status = { ...state.status, error };
    }),
    clearError: () => set((state) => {
      state.status = { ...initialState.status, error: null };
    }),
    addChartData: (type, value) => {
      const now = new Date();
      const displayTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const newPoint = { time: now.toISOString(), displayTime, value };
      set((state) => {
        const newHistory = { ...state.chartHistory };
        newHistory[type].push(newPoint);
        if (newHistory[type].length > 60) {
          newHistory[type].shift();
        }
        // Only update chartHistory field to minimize re-renders
        state.chartHistory = newHistory;
      });
    },
    setChartData: (data) => {
      set(() => {
        // Replace entire chart history with provided complete data
        // This is optimized for batch updates - all 5 chart types updated in one call
        // Ensures single setState for all chart updates (batching improvement)
        return { chartHistory: data };
      });
    },
    trimChartData: (maxPoints = 200) => {
      set((state) => {
        const trimmed = { ...state.chartHistory };
        (Object.keys(trimmed) as Array<keyof ChartHistory>).forEach((key) => {
          if (maxPoints <= 0) {
            trimmed[key] = [];
          } else {
            trimmed[key] = trimmed[key].slice(0, maxPoints);
          }
        });
        state.chartHistory = trimmed;
      });
    },
    clearChartData: () => {
      set(() => {
        // Replace entire chart history with empty history
        // This is optimized for batch updates - all 5 chart types updated in one call
        // Ensures single setState for all chart updates (batching improvement)
        return { chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } };
      });
    },
    rebuildChartHistory: (metrics) =>
      set(() => {
        // Create initial chart history from current metrics
        const now = new Date();
        const displayTime = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const createDataPoint = (value: number) => ({
          time: now.toISOString(),
          displayTime,
          value,
        });

        const history: ChartHistory = {
          cpu: metrics.cpuUsage !== undefined ? [createDataPoint(metrics.cpuUsage)] : [],
          memory: metrics.memoryUsage !== undefined ? [createDataPoint(metrics.memoryUsage)] : [],
          requests: metrics.totalRequests !== undefined ? [createDataPoint(metrics.totalRequests)] : [],
          gpuUtil: metrics.gpuUsage !== undefined ? [createDataPoint(metrics.gpuUsage)] : [],
          power: metrics.gpuPowerUsage !== undefined ? [createDataPoint(metrics.gpuPowerUsage)] : [],
        };

        return { chartHistory: history };
      }),
  }))
);

export const useStore = useAppStore;

// Export getState for direct access to store state
export const getState = useAppStore.getState;

// Selectors for fine-grained state access
export const selectModels = (state: AppStore) => state.models;
export const selectActiveModel = (state: AppStore) =>
  state.models.find((model) => model.id === state.activeModelId) || null;
export const selectMetrics = (state: AppStore) => state.metrics;
export const selectLogs = (state: AppStore) => state.logs;
export const selectSettings = (state: AppStore) => state.settings;
export const selectStatus = (state: AppStore) => state.status;
export const selectChartHistory = (state: AppStore) => state.chartHistory;
export const useLlamaServerStatus = () => storeWithShallow((state) => state.status.llamaServerStatus, shallow);

/**
 * Custom hooks with shallow comparison
 * These hooks prevent unnecessary re-renders when their selected data hasn't changed
 * Shallow comparison is used for object/array selectors to avoid deep equality checks
 *
 * Benefits:
 * - Components only re-render when their specific data changes
 * - Improves performance by reducing cascade re-renders
 * - Maintains clean separation of concerns
 *
 * Usage:
 * - useModels() - Subscribe to models list
 * - useMetrics() - Subscribe to metrics data
 * - useChartHistory() - Subscribe to chart history arrays
 *
 * Note: Connection state (isConnected, connectionState, reconnectionAttempts) is managed
 * by the useWebSocket hook, not the Zustand store.
 */
// Using type assertion to enable shallow comparison support
const storeWithShallow = useAppStore as unknown as <T>(selector: (state: AppStore) => T, equalityFn?: (a: T, b: T) => boolean) => T;

export const useModels = () => storeWithShallow((state) => state.models, shallow);
export const useMetrics = () => storeWithShallow((state) => state.metrics, shallow);
export const useChartHistory = () => storeWithShallow((state) => state.chartHistory, shallow);
