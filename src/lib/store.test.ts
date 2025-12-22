import { renderHook, act } from "@testing-library/react";
import { useStore } from "@lib/store";
import { ModelConfig, SystemMetrics, LogEntry } from "@types/global";

describe("App Store", () => {
  beforeEach(() => {
    // Clear the store before each test
    useStore.getState().setModels([]);
    useStore.getState().setActiveModel(null);
    useStore.getState().setMetrics(null);
    useStore.getState().clearLogs();
  });

  describe("Models Management", () => {
    it("should initialize with empty models", () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.models).toEqual([]);
    });

    it("should add a model", () => {
      const { result } = renderHook(() => useStore());
      const newModel: ModelConfig = {
        id: "1",
        name: "Test Model",
        type: "llama",
        parameters: {},
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addModel(newModel);
      });

      expect(result.current.models).toHaveLength(1);
      expect(result.current.models[0]).toEqual(newModel);
    });

    it("should update a model", () => {
      const { result } = renderHook(() => useStore());
      const model: ModelConfig = {
        id: "1",
        name: "Test Model",
        type: "llama",
        parameters: {},
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addModel(model);
        result.current.updateModel("1", { status: "running" });
      });

      expect(result.current.models[0].status).toBe("running");
    });

    it("should remove a model", () => {
      const { result } = renderHook(() => useStore());
      const model: ModelConfig = {
        id: "1",
        name: "Test Model",
        type: "llama",
        parameters: {},
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addModel(model);
        result.current.removeModel("1");
      });

      expect(result.current.models).toHaveLength(0);
    });

    it("should set active model", () => {
      const { result } = renderHook(() => useStore());
      const model: ModelConfig = {
        id: "1",
        name: "Test Model",
        type: "llama",
        parameters: {},
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addModel(model);
        result.current.setActiveModel("1");
      });

      expect(result.current.activeModelId).toBe("1");
    });
  });

  describe("Metrics Management", () => {
    it("should initialize with null metrics", () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.metrics).toBeNull();
    });

    it("should set metrics", () => {
      const { result } = renderHook(() => useStore());
      const metrics: SystemMetrics = {
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 32.1,
        activeModels: 2,
        totalRequests: 150,
        avgResponseTime: 120,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      act(() => {
        result.current.setMetrics(metrics);
      });

      expect(result.current.metrics).toEqual(metrics);
    });
  });

  describe("Logs Management", () => {
    it("should initialize with empty logs", () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.logs).toEqual([]);
    });

    it("should add a log", () => {
      const { result } = renderHook(() => useStore());
      const log: LogEntry = {
        id: "1",
        level: "info",
        message: "Test log message",
        timestamp: new Date().toISOString(),
      };

      act(() => {
        result.current.addLog(log);
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toEqual(log);
    });

    it("should limit logs to 100 entries", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addLog({
            id: i.toString(),
            level: "info",
            message: `Log ${i}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      expect(result.current.logs).toHaveLength(100);
    });

    it("should clear logs", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLog({
          id: "1",
          level: "info",
          message: "Test log",
          timestamp: new Date().toISOString(),
        });
        result.current.clearLogs();
      });

      expect(result.current.logs).toHaveLength(0);
    });
  });

  describe("Settings Management", () => {
    it("should initialize with default settings", () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.settings).toEqual({
        theme: "system",
        notifications: true,
        autoRefresh: true,
      });
    });

    it("should update settings", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateSettings({ theme: "dark", notifications: false });
      });

      expect(result.current.settings).toEqual({
        theme: "dark",
        notifications: false,
        autoRefresh: true, // Should remain unchanged
      });
    });
  });

  describe("Status Management", () => {
    it("should initialize with default status", () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.status).toEqual({
        isLoading: false,
        error: null,
      });
    });

    it("should set loading state", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.status.isLoading).toBe(true);
    });

    it("should set and clear error", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setError("Test error");
        expect(result.current.status.error).toBe("Test error");

        result.current.clearError();
        expect(result.current.status.error).toBeNull();
      });
    });
  });
});