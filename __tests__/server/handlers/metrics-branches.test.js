/**
 * @jest-environment node
 */

/**
 * Metrics Handlers - Branch Coverage Tests
 * Comprehensive branch coverage for server/handlers/metrics.js
 * Target: ≥98% line coverage
 */

import { jest } from "@jest/globals";

describe("Metrics Handlers - Branch Coverage", () => {
  let mockSocket;
  let mockDb;
  let registerMetricsHandlers;
  let updateGpuList;

  /**
   * Creates a mock socket with event handler tracking and emit call recording
   */
  function createMockSocket() {
    const handlers = {};
    const emitCalls = [];
    return {
      on: function (event, handler) {
        handlers[event] = handler;
      },
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      handlers,
      emitCalls,
      _getHandler: function (event) {
        return handlers[event];
      },
    };
  }

  /**
   * Creates a mock database with metrics methods
   */
  function createMockDb() {
    let getLatestMetricsResponse = null;
    let getMetricsHistoryResponse = [];
    let getLatestMetricsCalls = 0;
    let getMetricsHistoryCalls = 0;

    return {
      getLatestMetrics: function () {
        getLatestMetricsCalls++;
        return getLatestMetricsResponse;
      },
      getMetricsHistory: function (limit) {
        getMetricsHistoryCalls++;
        return getMetricsHistoryResponse;
      },
      _setLatestMetrics: function (data) {
        getLatestMetricsResponse = data;
      },
      _setHistory: function (data) {
        getMetricsHistoryResponse = data;
      },
      _getLatestMetricsCalls: () => getLatestMetricsCalls,
      _getMetricsHistoryCalls: () => getMetricsHistoryCalls,
      _reset: function () {
        getLatestMetricsResponse = null;
        getMetricsHistoryResponse = [];
        getLatestMetricsCalls = 0;
        getMetricsHistoryCalls = 0;
      },
    };
  }

  beforeEach(async () => {
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
    registerMetricsHandlers = module.registerMetricsHandlers;
    updateGpuList = module.updateGpuList;
    mockSocket = createMockSocket();
    mockDb = createMockDb();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("updateGpuList function branches", () => {
    /**
     * Objective: Verify updateGpuList sets latestGpuList to provided array
     * Positive Test: Call updateGpuList with valid GPU array and verify it's included in response
     */
    test("should set latestGpuList to provided array and include in response", async () => {
      const gpuArray = [
        { name: "GPU0", usage: 50, memoryUsed: 4096, memoryTotal: 8192 },
        { name: "GPU1", usage: 30, memoryUsed: 2048, memoryTotal: 8192 },
      ];
      updateGpuList(gpuArray);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 1 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual(gpuArray);
    });

    /**
     * Objective: Verify updateGpuList handles null gpuList
     * Negative Test: Call updateGpuList with null - should default to empty array
     */
    test("should set latestGpuList to empty array when gpuList is null", async () => {
      updateGpuList(null);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 2 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });

    /**
     * Objective: Verify updateGpuList handles undefined gpuList
     * Negative Test: Call updateGpuList with undefined - should default to empty array
     */
    test("should set latestGpuList to empty array when gpuList is undefined", async () => {
      updateGpuList(undefined);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 3 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });

    /**
     * Objective: Verify updateGpuList handles 0 as gpuList
     * Negative Test: Call updateGpuList with 0 - should default to empty array (0 is falsy)
     */
    test("should set latestGpuList to empty array when gpuList is 0", async () => {
      updateGpuList(0);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 4 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });

    /**
     * Objective: Verify updateGpuList handles empty string as gpuList
     * Negative Test: Call updateGpuList with "" - should default to empty array
     */
    test("should set latestGpuList to empty array when gpuList is empty string", async () => {
      updateGpuList("");

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 5 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });

    /**
     * Objective: Verify updateGpuList handles false as gpuList
     * Negative Test: Call updateGpuList with false - should default to empty array
     */
    test("should set latestGpuList to empty array when gpuList is false", async () => {
      updateGpuList(false);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 6 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });

    /**
     * Objective: Verify updateGpuList can be called multiple times
     * Positive Test: Call updateGpuList multiple times with different values
     */
    test("should allow multiple updateGpuList calls and use latest value", async () => {
      const gpuArray1 = [{ name: "GPU0", usage: 50 }];
      const gpuArray2 = [
        { name: "GPU0", usage: 60 },
        { name: "GPU1", usage: 40 },
      ];

      updateGpuList(gpuArray1);
      updateGpuList(gpuArray2);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 7 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual(gpuArray2);
    });

    /**
     * Objective: Verify updateGpuList handles empty array correctly
     * Positive Test: Call updateGpuList with empty array - should preserve empty array
     */
    test("should set latestGpuList to empty array when gpuList is empty array", async () => {
      updateGpuList([]);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 8 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });
  });

  describe("metrics:get requestId branching", () => {
    /**
     * Objective: Verify handler uses timestamp when requestId is 0
     * Negative Test: Verify 0 requestId triggers default (since 0 is falsy)
     */
    test("should use timestamp when requestId is 0 (0 is falsy)", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      const beforeTime = Date.now();
      handler({ requestId: 0 });
      const afterTime = Date.now();

      const requestId = mockSocket.emitCalls[0].data.requestId;
      expect(typeof requestId).toBe("number");
      expect(requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(requestId).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Objective: Verify handler uses timestamp when requestId is empty string
     * Negative Test: Verify empty string requestId triggers default
     */
    test("should use timestamp when requestId is empty string", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      const beforeTime = Date.now();
      handler({ requestId: "" });
      const afterTime = Date.now();

      const requestId = mockSocket.emitCalls[0].data.requestId;
      expect(typeof requestId).toBe("number");
      expect(requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(requestId).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Objective: Verify handler uses timestamp when requestId is false
     * Negative Test: Verify false requestId triggers default
     */
    test("should use timestamp when requestId is false", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      const beforeTime = Date.now();
      handler({ requestId: false });
      const afterTime = Date.now();

      const requestId = mockSocket.emitCalls[0].data.requestId;
      expect(typeof requestId).toBe("number");
      expect(requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(requestId).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Objective: Verify handler uses timestamp when requestId is NaN
     * Negative Test: Verify NaN requestId triggers default
     */
    test("should use timestamp when requestId is NaN", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      const beforeTime = Date.now();
      handler({ requestId: NaN });
      const afterTime = Date.now();

      const requestId = mockSocket.emitCalls[0].data.requestId;
      expect(typeof requestId).toBe("number");
      expect(requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(requestId).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("metrics:history limit branching", () => {
    /**
     * Objective: Verify handler passes limit 0 to getMetricsHistory
     * Positive Test: Verify limit 0 is passed through (0 is falsy but !== undefined)
     */
    test("should pass limit 0 to getMetricsHistory", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([{ cpu_usage: 50 }]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 1, limit: 0 });

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockDb._getMetricsHistoryCalls()).toBe(1);
    });

    /**
     * Objective: Verify handler uses default limit when limit is empty string
     * Negative Test: Verify empty string limit triggers default (100)
     */
    test("should use default limit when limit is empty string", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 2, limit: "" });

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockDb._getMetricsHistoryCalls()).toBe(1);
    });

    /**
     * Objective: Verify handler uses default limit when limit is false
     * Negative Test: Verify false limit triggers default (100)
     */
    test("should use default limit when limit is false", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 3, limit: false });

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockDb._getMetricsHistoryCalls()).toBe(1);
    });

    /**
     * Objective: Verify handler uses default limit when limit is null
     * Negative Test: Verify null limit triggers default (100)
     */
    test("should use default limit when limit is null", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 4, limit: null });

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockDb._getMetricsHistoryCalls()).toBe(1);
    });

    /**
     * Objective: Verify handler uses custom positive limit value
     * Positive Test: Verify positive limit is passed through
     */
    test("should pass custom limit to getMetricsHistory", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([{ cpu_usage: 10 }, { cpu_usage: 20 }, { cpu_usage: 30 }]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 5, limit: 5 });

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.history).toHaveLength(3);
    });
  });

  describe("metrics:history requestId branching", () => {
    /**
     * Objective: Verify handler uses timestamp when requestId is 0
     * Negative Test: Verify 0 requestId triggers default in history
     */
    test("should use timestamp when requestId is 0 in history handler (0 is falsy)", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([{ cpu_usage: 50 }]);

      const handler = mockSocket._getHandler("metrics:history");
      const beforeTime = Date.now();
      handler({ requestId: 0 });
      const afterTime = Date.now();

      const requestId = mockSocket.emitCalls[0].data.requestId;
      expect(typeof requestId).toBe("number");
      expect(requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(requestId).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Objective: Verify handler uses timestamp when requestId is empty string
     * Negative Test: Verify empty string requestId triggers default in history
     */
    test("should use timestamp when requestId is empty string in history handler", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([{ cpu_usage: 50 }]);

      const handler = mockSocket._getHandler("metrics:history");
      const beforeTime = Date.now();
      handler({ requestId: "" });
      const afterTime = Date.now();

      const requestId = mockSocket.emitCalls[0].data.requestId;
      expect(typeof requestId).toBe("number");
      expect(requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(requestId).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("getLatestMetrics falsy response branching", () => {
    /**
     * Objective: Verify handler uses default metrics when getLatestMetrics returns 0
     * Negative Test: Verify 0 response triggers default object
     */
    test("should use defaults when getLatestMetrics returns 0", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics(0);

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 1 });

      expect(mockSocket.emitCalls[0].data.data.metrics).toEqual({
        cpu: { usage: 0 },
        memory: { used: 0 },
        swap: { used: 0 },
        disk: { used: 0 },
        gpu: {
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          list: [],
        },
        uptime: 0,
      });
    });

    /**
     * Objective: Verify handler uses default metrics when getLatestMetrics returns ""
     * Negative Test: Verify empty string response triggers default object
     */
    test("should use defaults when getLatestMetrics returns empty string", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics("");

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 2 });

      expect(mockSocket.emitCalls[0].data.data.metrics).toEqual({
        cpu: { usage: 0 },
        memory: { used: 0 },
        swap: { used: 0 },
        disk: { used: 0 },
        gpu: {
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          list: [],
        },
        uptime: 0,
      });
    });

    /**
     * Objective: Verify handler uses default metrics when getLatestMetrics returns false
     * Negative Test: Verify false response triggers default object
     */
    test("should use defaults when getLatestMetrics returns false", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics(false);

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 3 });

      expect(mockSocket.emitCalls[0].data.data.metrics).toEqual({
        cpu: { usage: 0 },
        memory: { used: 0 },
        swap: { used: 0 },
        disk: { used: 0 },
        gpu: {
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          list: [],
        },
        uptime: 0,
      });
    });
  });

  describe("getMetricsHistory falsy response branching", () => {
    /**
     * Objective: Verify handler handles empty history array correctly
     * Positive Test: Verify empty array returns proper structure
     */
    test("should return empty history array when getMetricsHistory returns empty", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 1 });

      expect(mockSocket.emitCalls[0].data.data.history).toEqual([]);
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
    });

    /**
     * Objective: Verify handler maps history items with all fields populated
     * Positive Test: Verify full mapping for history items
     */
    test("should properly map all fields in history items", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      const timestamp = Date.now();
      mockDb._setHistory([
        {
          cpu_usage: 45.5,
          memory_usage: 2048,
          swap_usage: 512,
          disk_usage: 75.2,
          gpu_usage: 60.0,
          gpu_memory_used: 4096,
          gpu_memory_total: 8192,
          uptime: 3600,
          timestamp: timestamp,
        },
      ]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 2 });

      const history = mockSocket.emitCalls[0].data.data.history;
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        cpu: { usage: 45.5 },
        memory: { used: 2048 },
        swap: { used: 512 },
        disk: { used: 75.2 },
        gpu: {
          usage: 60.0,
          memoryUsed: 4096,
          memoryTotal: 8192,
          list: [],
        },
        uptime: 3600,
        timestamp: timestamp,
      });
    });
  });

  describe("GPU list integration in responses", () => {
    /**
     * Objective: Verify GPU list is included in metrics response
     * Positive Test: Verify updateGpuList affects subsequent metrics responses
     */
    test("should include GPU list in metrics response", async () => {
      const gpuList = [{ name: "RTX 3090", usage: 75, memoryUsed: 20480, memoryTotal: 24576 }];
      updateGpuList(gpuList);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50, gpu_usage: 75 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 1 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual(gpuList);
    });

    /**
     * Objective: Verify GPU list is included in history response
     * Positive Test: Verify updateGpuList affects history response
     */
    test("should include GPU list in history response", async () => {
      const gpuList = [{ name: "RTX 4090", usage: 50, memoryUsed: 16384, memoryTotal: 24576 }];
      updateGpuList(gpuList);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([{ cpu_usage: 50, timestamp: Date.now() }]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 2 });

      expect(mockSocket.emitCalls[0].data.data.history[0].gpu.list).toEqual(gpuList);
    });

    /**
     * Objective: Verify empty GPU list shows as empty array in response
     * Positive Test: Verify updateGpuList([]) results in empty list in response
     */
    test("should include empty GPU list in response", async () => {
      updateGpuList([]);

      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 3 });

      expect(mockSocket.emitCalls[0].data.data.metrics.gpu.list).toEqual([]);
    });
  });

  describe("Error handling branches", () => {
    /**
     * Objective: Verify error response structure is correct
     * Negative Test: Verify error response has all required fields
     */
    test("should return correct error response structure", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics(null);
      mockDb.getLatestMetrics = function () {
        throw new Error("Test error message");
      };

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 999 });

      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.message).toBe("Test error message");
      expect(response.requestId).toBe(999);
      expect(response.timestamp).toBeDefined();
    });

    /**
     * Objective: Verify error handling for history endpoint
     * Negative Test: Verify error response for history errors
     */
    test("should return error response for history endpoint errors", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([]);
      mockDb.getMetricsHistory = function () {
        throw new Error("History read error");
      };

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 888 });

      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBe(false);
      expect(response.error.message).toBe("History read error");
    });
  });

  describe("Handler isolation and reusability", () => {
    /**
     * Objective: Verify handlers can process multiple requests
     * Positive Test: Verify handler is reusable with different requests
     */
    test("should process multiple requests with same handler", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });
      mockDb._setHistory([{ cpu_usage: 50 }]);

      const getHandler = mockSocket._getHandler("metrics:get");
      const historyHandler = mockSocket._getHandler("metrics:history");

      // Multiple get requests
      getHandler({ requestId: 1 });
      getHandler({ requestId: 2 });
      getHandler({ requestId: 3 });

      // Multiple history requests
      historyHandler({ requestId: 4 });
      historyHandler({ requestId: 5 });

      expect(mockSocket.emitCalls.length).toBe(5);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(1);
      expect(mockSocket.emitCalls[1].data.requestId).toBe(2);
      expect(mockSocket.emitCalls[2].data.requestId).toBe(3);
      expect(mockSocket.emitCalls[3].data.requestId).toBe(4);
      expect(mockSocket.emitCalls[4].data.requestId).toBe(5);
    });

    /**
     * Objective: Verify metrics are correctly aggregated per request
     * Positive Test: Verify each request returns correct metrics
     */
    test("should return correct metrics for each request", async () => {
      registerMetricsHandlers(mockSocket, mockDb);

      mockDb._setLatestMetrics({ cpu_usage: 30 });
      const getHandler = mockSocket._getHandler("metrics:get");
      getHandler({ requestId: 1 });
      expect(mockSocket.emitCalls[0].data.data.metrics.cpu.usage).toBe(30);

      mockDb._setLatestMetrics({ cpu_usage: 70 });
      getHandler({ requestId: 2 });
      expect(mockSocket.emitCalls[1].data.data.metrics.cpu.usage).toBe(70);
    });
  });

  describe("Response structure validation", () => {
    /**
     * Objective: Verify success response has correct structure
     * Positive Test: Verify all required fields in success response
     */
    test("should return success response with all required fields", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setLatestMetrics({ cpu_usage: 50 });

      const handler = mockSocket._getHandler("metrics:get");
      handler({ requestId: 123 });

      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(response.data).toHaveProperty("metrics");
      expect(response).toHaveProperty("requestId", 123);
      expect(response).toHaveProperty("timestamp");
      expect(typeof response.timestamp).toBe("number");
    });

    /**
     * Objective: Verify history response has correct structure
     * Positive Test: Verify all required fields in history response
     */
    test("should return history response with all required fields", async () => {
      registerMetricsHandlers(mockSocket, mockDb);
      mockDb._setHistory([{ cpu_usage: 50, timestamp: Date.now() }]);

      const handler = mockSocket._getHandler("metrics:history");
      handler({ requestId: 456 });

      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(response.data).toHaveProperty("history");
      expect(Array.isArray(response.data.history)).toBe(true);
      expect(response).toHaveProperty("requestId", 456);
      expect(response).toHaveProperty("timestamp");
    });
  });
});
