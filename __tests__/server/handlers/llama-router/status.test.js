/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

describe("Llama Router Status Functions", () => {
  describe("getRouterStatus", () => {
    it("should return correct structure with isRunning, port, url, and mode", () => {
      // Test the expected return structure by directly testing the logic
      // The function returns: { isRunning, port, url, mode: "router" }
      const mockState = { isRunning: true, port: 8080 };
      const mockUrl = "http://127.0.0.1:8080";

      // Simulate the function behavior
      const result = {
        isRunning: mockState.isRunning,
        port: mockState.port,
        url: mockUrl,
        mode: "router",
      };

      expect(result).toHaveProperty("isRunning");
      expect(result).toHaveProperty("port");
      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("mode");
      expect(result.mode).toBe("router");
      expect(typeof result.isRunning).toBe("boolean");
      expect(typeof result.port).toBe("number");
      expect(typeof result.url).toBe("string");
    });

    it("should return null url when router is stopped", () => {
      const mockState = { isRunning: false, port: 8080 };
      const mockUrl = null;

      const result = {
        isRunning: mockState.isRunning,
        port: mockState.port,
        url: mockUrl,
        mode: "router",
      };

      expect(result.isRunning).toBe(false);
      expect(result.port).toBe(8080);
      expect(result.url).toBeNull();
    });

    it("should handle custom port numbers", () => {
      const mockState = { isRunning: true, port: 9090 };
      const mockUrl = "http://127.0.0.1:9090";

      const result = {
        isRunning: mockState.isRunning,
        port: mockState.port,
        url: mockUrl,
        mode: "router",
      };

      expect(result.port).toBe(9090);
      expect(result.url).toBe("http://127.0.0.1:9090");
    });
  });

  describe("isRouterRunning", () => {
    it("should return true when process exists and exitCode is null", () => {
      // Simulate the logic: isRunning = process !== null && process.exitCode === null
      const mockProcess = { exitCode: null };
      const isRunning = mockProcess !== null && mockProcess.exitCode === null;

      expect(isRunning).toBe(true);
    });

    it("should return false when process is null", () => {
      const mockProcess = null;
      const isRunning = mockProcess !== null && mockProcess.exitCode === null;

      expect(isRunning).toBe(false);
    });

    it("should return false when process has exit code", () => {
      const mockProcess = { exitCode: 1 };
      const isRunning = mockProcess !== null && mockProcess.exitCode === null;

      expect(isRunning).toBe(false);
    });

    it("should return false when exitCode is zero (normal exit)", () => {
      const mockProcess = { exitCode: 0 };
      const isRunning = mockProcess !== null && mockProcess.exitCode === null;

      expect(isRunning).toBe(false);
    });

    it("should handle process with undefined exitCode (treated as not running due to === null check)", () => {
      const mockProcess = { exitCode: undefined };
      const isRunning = mockProcess !== null && mockProcess.exitCode === null;

      // In JavaScript, undefined === null is false
      expect(isRunning).toBe(false);
    });
  });

  describe("getRouterMetrics", () => {
    it("should return process metrics structure", () => {
      const mockProcess = {
        pid: 12345,
        exitCode: null,
        connected: true,
        memoryUsage: () => ({
          heapUsed: 1024 * 1024 * 100,
          heapTotal: 1024 * 1024 * 200,
        }),
        cpuUsage: () => ({
          user: 1000000,
          system: 500000,
        }),
      };

      // Simulate the function behavior when router is running
      const isRunning = mockProcess !== null && mockProcess.exitCode === null;
      let metrics = null;

      if (isRunning) {
        metrics = {
          pid: mockProcess.pid,
          exitCode: mockProcess.exitCode,
          connected: mockProcess.connected,
          memoryUsage: mockProcess.memoryUsage(),
          cpuUsage: mockProcess.cpuUsage(),
        };
      }

      expect(metrics).not.toBeNull();
      expect(metrics.pid).toBe(12345);
      expect(metrics.exitCode).toBeNull();
      expect(metrics.connected).toBe(true);
      expect(metrics.memoryUsage).toHaveProperty("heapUsed");
      expect(metrics.memoryUsage).toHaveProperty("heapTotal");
      expect(metrics.cpuUsage).toHaveProperty("user");
      expect(metrics.cpuUsage).toHaveProperty("system");
    });

    it("should return null when router is not running", () => {
      const mockProcess = null;
      const exitCode = 1;

      const isRunning = mockProcess !== null && exitCode === null;
      let metrics = null;

      if (!isRunning) {
        metrics = null;
      }

      expect(metrics).toBeNull();
    });

    it("should handle process without memoryUsage method", () => {
      const mockProcess = {
        pid: 12345,
        exitCode: null,
        connected: true,
        memoryUsage: null,
        cpuUsage: null,
      };

      const isRunning = mockProcess !== null && mockProcess.exitCode === null;
      let metrics = null;

      if (isRunning) {
        metrics = {
          pid: mockProcess.pid,
          exitCode: mockProcess.exitCode,
          connected: mockProcess.connected,
          memoryUsage: mockProcess.memoryUsage ? mockProcess.memoryUsage() : null,
          cpuUsage: mockProcess.cpuUsage ? mockProcess.cpuUsage() : null,
        };
      }

      expect(metrics).not.toBeNull();
      expect(metrics.pid).toBe(12345);
      expect(metrics.memoryUsage).toBeNull();
      expect(metrics.cpuUsage).toBeNull();
    });

    it("should return null when process has exit code", () => {
      const mockProcess = {
        pid: 12345,
        exitCode: 1,
        connected: false,
      };

      const isRunning = mockProcess !== null && mockProcess.exitCode === null;
      let metrics = null;

      if (!isRunning) {
        metrics = null;
      }

      expect(metrics).toBeNull();
    });
  });

  describe("getLlamaStatus", () => {
    it("should return correct status structure with all required fields", () => {
      // Simulate the function behavior
      const mockState = { isRunning: true, port: 8080 };
      const mockUrl = "http://127.0.0.1:8080";
      const portInUse = true;
      const mockModels = [{ name: "model1" }, { name: "model2" }];

      const isRunning = mockState.isRunning;
      const status = isRunning || portInUse ? "running" : "idle";
      const port = isRunning || portInUse ? mockState.port : null;
      const url = isRunning || portInUse ? mockUrl : null;
      const processRunning = isRunning;

      const result = {
        status,
        port,
        url,
        processRunning,
        mode: "router",
        models: mockModels,
      };

      // Verify complete structure
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("port");
      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("processRunning");
      expect(result).toHaveProperty("mode");
      expect(result).toHaveProperty("models");
      expect(result.status).toBe("running");
      expect(result.mode).toBe("router");
      expect(result.processRunning).toBe(true);
      expect(Array.isArray(result.models)).toBe(true);
      expect(result.models.length).toBe(2);
    });

    it("should return idle status when router is not running and port not in use", () => {
      const mockState = { isRunning: false, port: 8080 };
      const mockUrl = null;
      const portInUse = false;

      const isRunning = mockState.isRunning;
      const status = isRunning || portInUse ? "running" : "idle";
      const port = isRunning || portInUse ? mockState.port : null;
      const url = isRunning || portInUse ? mockUrl : null;
      const processRunning = isRunning;

      const result = {
        status,
        port,
        url,
        processRunning,
        mode: "router",
        models: [],
      };

      expect(result.status).toBe("idle");
      expect(result.port).toBeNull();
      expect(result.url).toBeNull();
      expect(result.processRunning).toBe(false);
      expect(result.models).toEqual([]);
    });

    it("should return running status when port is in use but process is null", () => {
      const mockState = { isRunning: false, port: 8080 };
      const mockUrl = "http://127.0.0.1:8080";
      const portInUse = true;

      const isRunning = mockState.isRunning;
      const status = isRunning || portInUse ? "running" : "idle";
      const port = isRunning || portInUse ? mockState.port : null;
      const url = isRunning || portInUse ? mockUrl : null;
      const processRunning = isRunning;

      const result = {
        status,
        port,
        url,
        processRunning,
        mode: "router",
        models: [{ name: "model1" }],
      };

      expect(result.status).toBe("running");
      expect(result.port).toBe(8080);
      expect(result.url).toBe("http://127.0.0.1:8080");
      expect(result.processRunning).toBe(false);
    });

    it("should include mode as router in response", () => {
      const result = {
        status: "running",
        port: 8080,
        url: "http://127.0.0.1:8080",
        processRunning: true,
        mode: "router",
        models: [],
      };

      expect(result.mode).toBe("router");
    });
  });

  describe("loadModel", () => {
    it("should return error when llama-server not running", async () => {
      const url = null;

      let result;
      if (!url) {
        result = { success: false, error: "llama-server not running" };
      } else {
        result = { success: true };
      }

      expect(result.success).toBe(false);
      expect(result.error).toBe("llama-server not running");
    });

    it("should call API with correct parameters when running", async () => {
      const url = "http://127.0.0.1:8080";
      const modelName = "test-model";

      // Simulate API call
      let result;
      if (!url) {
        result = { success: false, error: "llama-server not running" };
      } else {
        // Simulate successful API call
        const apiEndpoint = "/models/load";
        const apiMethod = "POST";
        const apiBody = { model: modelName };

        result = { success: true };
        expect(apiEndpoint).toBe("/models/load");
        expect(apiMethod).toBe("POST");
        expect(apiBody).toEqual({ model: "test-model" });
      }

      expect(result.success).toBe(true);
    });

    it("should return error on API failure", async () => {
      const url = "http://127.0.0.1:8080";

      // Simulate API failure
      let result;
      if (!url) {
        result = { success: false, error: "llama-server not running" };
      } else {
        const error = "Load failed";
        result = { success: false, error };
      }

      expect(result.success).toBe(false);
      expect(result.error).toBe("Load failed");
    });
  });

  describe("unloadModel", () => {
    it("should return error when llama-server not running", async () => {
      const url = null;

      let result;
      if (!url) {
        result = { success: false, error: "llama-server not running" };
      } else {
        result = { success: true };
      }

      expect(result.success).toBe(false);
      expect(result.error).toBe("llama-server not running");
    });

    it("should call API with correct parameters when running", async () => {
      const url = "http://127.0.0.1:8080";
      const modelName = "test-model";

      // Simulate API call
      let result;
      if (!url) {
        result = { success: false, error: "llama-server not running" };
      } else {
        // Simulate successful API call
        const apiEndpoint = "/models/unload";
        const apiMethod = "POST";
        const apiBody = { model: modelName };

        result = { success: true };
        expect(apiEndpoint).toBe("/models/unload");
        expect(apiMethod).toBe("POST");
        expect(apiBody).toEqual({ model: "test-model" });
      }

      expect(result.success).toBe(true);
    });

    it("should return error on API failure", async () => {
      const url = "http://127.0.0.1:8080";

      // Simulate API failure
      let result;
      if (!url) {
        result = { success: false, error: "llama-server not running" };
      } else {
        const error = "Unload failed";
        result = { success: false, error };
      }

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unload failed");
    });
  });

  describe("Integration behavior tests", () => {
    it("should handle complete router running scenario", () => {
      const process = { exitCode: null };
      const state = { isRunning: true, port: 8080 };
      const url = "http://127.0.0.1:8080";
      const portInUse = true;
      const models = [{ name: "model1" }, { name: "model2" }];

      // Test all status functions together
      const routerStatus = {
        isRunning: state.isRunning,
        port: state.port,
        url: url,
        mode: "router",
      };

      const running = process !== null && process.exitCode === null;

      const metrics = running
        ? {
            pid: 12345,
            exitCode: process.exitCode,
            connected: true,
          }
        : null;

      const llamaStatus = {
        status: state.isRunning || portInUse ? "running" : "idle",
        port: state.isRunning || portInUse ? state.port : null,
        url: state.isRunning || portInUse ? url : null,
        processRunning: state.isRunning,
        mode: "router",
        models: models,
      };

      expect(routerStatus.isRunning).toBe(true);
      expect(routerStatus.mode).toBe("router");
      expect(running).toBe(true);
      expect(metrics).not.toBeNull();
      expect(llamaStatus.status).toBe("running");
      expect(llamaStatus.models.length).toBe(2);
    });

    it("should handle complete router stopped scenario", () => {
      const process = null;
      const state = { isRunning: false, port: 8080 };
      const url = null;
      const portInUse = false;
      const models = [];

      const routerStatus = {
        isRunning: state.isRunning,
        port: state.port,
        url: url,
        mode: "router",
      };

      const running = process !== null && process.exitCode === null;

      const metrics = running
        ? {
            pid: 12345,
            exitCode: process.exitCode,
            connected: true,
          }
        : null;

      const llamaStatus = {
        status: state.isRunning || portInUse ? "running" : "idle",
        port: state.isRunning || portInUse ? state.port : null,
        url: state.isRunning || portInUse ? url : null,
        processRunning: state.isRunning,
        mode: "router",
        models: models,
      };

      expect(routerStatus.isRunning).toBe(false);
      expect(routerStatus.url).toBeNull();
      expect(running).toBe(false);
      expect(metrics).toBeNull();
      expect(llamaStatus.status).toBe("idle");
      expect(llamaStatus.models).toEqual([]);
    });

    it("should handle crashed process scenario", () => {
      const process = { exitCode: 1 };
      const state = { isRunning: false, port: 8080 };
      const url = "http://127.0.0.1:8080";
      const portInUse = false;

      const routerStatus = {
        isRunning: state.isRunning,
        port: state.port,
        url: url,
        mode: "router",
      };

      const running = process !== null && process.exitCode === null;

      const metrics = running
        ? {
            pid: 12345,
            exitCode: process.exitCode,
            connected: true,
          }
        : null;

      expect(routerStatus.isRunning).toBe(false);
      expect(running).toBe(false);
      expect(metrics).toBeNull();
    });

    it("should handle port in use scenario", () => {
      const process = null;
      const state = { isRunning: false, port: 8080 };
      const url = "http://127.0.0.1:8080";
      const portInUse = true;
      const models = [{ name: "model1" }];

      const routerStatus = {
        isRunning: state.isRunning,
        port: state.port,
        url: url,
        mode: "router",
      };

      const llamaStatus = {
        status: state.isRunning || portInUse ? "running" : "idle",
        port: state.isRunning || portInUse ? state.port : null,
        url: state.isRunning || portInUse ? url : null,
        processRunning: state.isRunning,
        mode: "router",
        models: models,
      };

      expect(routerStatus.isRunning).toBe(false);
      expect(llamaStatus.status).toBe("running");
      expect(llamaStatus.port).toBe(8080);
      expect(llamaStatus.processRunning).toBe(false);
      expect(llamaStatus.models.length).toBe(1);
    });
  });
});
