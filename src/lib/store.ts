import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { APP_CONFIG } from "@/config/app.config";

// Define store types
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
  };
}

interface AppActions {
  setModels: (models: ModelConfig[]) => void;
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  setActiveModel: (id: string | null) => void;
  setMetrics: (metrics: SystemMetrics) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  updateSettings: (updates: Partial<AppState["settings"]>) => void;
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
  },
};

// Create store
const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Actions
      setModels: (models) => set({ models }),
      addModel: (model) => set((state) => ({ models: [...state.models, model] })),
      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((model) =>
            model.id === id ? { ...model, ...updates } : model
          ),
        })),
      removeModel: (id) =>
        set((state) => ({
          models: state.models.filter((model) => model.id !== id),
          activeModelId: state.activeModelId === id ? null : state.activeModelId,
        })),
      setActiveModel: (id) => set({ activeModelId: id }),
      setMetrics: (metrics) => set({ metrics }),
      addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 100) })),
      clearLogs: () => set({ logs: [] }),
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
      setLoading: (isLoading) => set({ status: { ...initialState.status, isLoading } }),
      setError: (error) => set({ status: { ...initialState.status, error } }),
      clearError: () => set({ status: { ...initialState.status, error: null } }),
    }),
    {
      name: "llama-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        models: state.models,
        activeModelId: state.activeModelId,
        settings: state.settings,
      }),
    }
  )
);

export const useStore = useAppStore;

export const selectModels = (state: AppState) => state.models;
export const selectActiveModel = (state: AppState) =>
  state.models.find((model) => model.id === state.activeModelId) || null;
export const selectMetrics = (state: AppState) => state.metrics;
export const selectLogs = (state: AppState) => state.logs;
export const selectSettings = (state: AppState) => state.settings;
export const selectStatus = (state: AppState) => state.status;