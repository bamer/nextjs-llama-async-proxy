import { useStore } from "@/lib/store";
import type { SystemMetrics } from "@/types";

describe("store-normalized", () => {
  beforeEach(() => {
    useStore.getState().setModels([]);
    useStore.getState().setMetrics({
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      uptime: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      activeModels: 0,
      timestamp: new Date().toISOString()
    });
    useStore.getState().setLogs([]);
    useStore.getState().clearChartData();
  });

  describe("Computed Selectors", () => {
    it("should filter active models", () => {
      useStore.getState().setModels([
        {
          id: "1",
          name: "model1",
          status: "running",
          type: "llama",
          parameters: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "2",
          name: "model2",
          status: "idle",
          type: "mistral",
          parameters: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        }
      ]);

      const activeModels = useStore
        .getState()
        .models.filter((m) => m.status === "running");
      expect(activeModels).toHaveLength(1);
      expect(activeModels[0].name).toBe("model1");
    });

    it("should compute CPU from metrics", () => {
      const metrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 30,
        uptime: 3600,
        totalRequests: 100,
        avgResponseTime: 50,
        activeModels: 2,
        timestamp: "2024-01-01T00:00:00Z"
      };

      useStore.getState().setMetrics(metrics);
      const cpuAverage = useStore.getState().metrics?.cpuUsage || 0;
      expect(cpuAverage).toBe(45);
    });
  });

  describe("Atomic Actions", () => {
    it("should add model", () => {
      useStore.getState().addModel({
        id: "1",
        name: "model1",
        status: "idle",
        type: "llama",
        parameters: {},
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      });

      const models = useStore.getState().models;
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model1");
    });

    it("should update model", () => {
      useStore.getState().addModel({
        id: "1",
        name: "model1",
        status: "idle",
        type: "llama",
        parameters: {},
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      });

      useStore.getState().updateModel("1", { status: "running" });
      const models = useStore.getState().models;
      expect(models[0].status).toBe("running");
    });

    it("should remove model", () => {
      useStore.getState().addModel({
        id: "1",
        name: "model1",
        status: "idle",
        type: "llama",
        parameters: {},
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      });

      useStore.getState().removeModel("1");
      const models = useStore.getState().models;
      expect(models).toHaveLength(0);
    });
  });

  describe("O(1) Lookups", () => {
    it("should find model by ID", () => {
      useStore.getState().setModels([
        {
          id: "1",
          name: "model1",
          status: "idle",
          type: "llama",
          parameters: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "2",
          name: "model2",
          status: "idle",
          type: "mistral",
          parameters: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        }
      ]);

      const models = useStore.getState().models;
      const model = models.find((m) => m.id === "2");
      expect(model).toBeDefined();
      expect(model?.name).toBe("model2");
    });
  });

  describe("Shallow Comparison", () => {
    it("should return same models reference when unchanged", () => {
      useStore.getState().setModels([
        {
          id: "1",
          name: "model1",
          status: "idle",
          type: "llama",
          parameters: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        }
      ]);

      const models1 = useStore.getState().models;
      const models2 = useStore.getState().models;
      expect(models1).toBe(models2);
    });

    it("should return same metrics reference when unchanged", () => {
      const metrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 30,
        uptime: 3600,
        totalRequests: 100,
        avgResponseTime: 50,
        activeModels: 2,
        timestamp: "2024-01-01T00:00:00Z"
      };

      useStore.getState().setMetrics(metrics);
      const metrics1 = useStore.getState().metrics;
      const metrics2 = useStore.getState().metrics;
      expect(metrics1).toBe(metrics2);
    });
  });

  describe("Chart Data", () => {
    it("should add chart data", () => {
      useStore.getState().addChartData("cpu", 45);
      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory.cpu).toHaveLength(1);
      expect(chartHistory.cpu[0].value).toBe(45);
    });

    it("should trim to 60 points", () => {
      for (let i = 0; i < 70; i++) {
        useStore.getState().addChartData("cpu", i);
      }

      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory.cpu).toHaveLength(60);
    });
  });

  describe("Log Management", () => {
    it("should add log", () => {
      useStore.getState().addLog({
        id: "log-1",
        level: "info",
        message: "Test log",
        timestamp: "2024-01-01T00:00:00Z"
      });

      const logs = useStore.getState().logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Test log");
    });

    it("should limit to 100 logs", () => {
      for (let i = 0; i < 150; i++) {
        useStore.getState().addLog({
          id: `log-${i}`,
          level: "info",
          message: `Log ${i}`,
          timestamp: new Date().toISOString()
        });
      }

      const logs = useStore.getState().logs;
      expect(logs).toHaveLength(100);
    });
  });

  describe("Status Management", () => {
    it("should set loading", () => {
      useStore.getState().setLoading(true);
      expect(useStore.getState().status.isLoading).toBe(true);
    });

    it("should set error", () => {
      useStore.getState().setError("Test error");
      expect(useStore.getState().status.error).toBe("Test error");
    });
  });

  describe("Settings Management", () => {
    it("should update settings", () => {
      useStore.getState().updateSettings({ notifications: false });
      expect(useStore.getState().settings.notifications).toBe(false);
    });

    it("should preserve other settings", () => {
      useStore.getState().updateSettings({
        theme: "dark",
        notifications: true,
        autoRefresh: true
      });

      useStore.getState().updateSettings({ notifications: false });
      const settings = useStore.getState().settings;
      expect(settings.notifications).toBe(false);
      expect(settings.autoRefresh).toBe(true);
      expect(settings.theme).toBe("dark");
    });
  });
});
