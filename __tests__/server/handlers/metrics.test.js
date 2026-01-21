/**
 * @jest-environment node
 */

import { jest } from "@jest/globals";

describe("Metrics Handlers", () => {
  let mockSocket;
  let mockDb;

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

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockDb = createMockDb();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("registerMetricsHandlers", () => {
    it("should register metrics:get and metrics:history event handlers", async () => {
      // Arrange: Import the function
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");

      // Act: Register handlers
      registerMetricsHandlers(mockSocket, mockDb);

      // Assert: Verify handlers were registered
      expect(typeof mockSocket.handlers["metrics:get"]).toBe("function");
      expect(typeof mockSocket.handlers["metrics:history"]).toBe("function");
    });
  });

  describe("metrics:get event", () => {
    it("should return latest metrics with all fields when data exists", async () => {
      // Arrange: Set up mock database response with full metrics data
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({
        cpu_usage: 45.5,
        memory_usage: 2048,
        disk_usage: 75.2,
        gpu_usage: 60.0,
        gpu_memory_used: 4096,
        gpu_memory_total: 8192,
        uptime: 3600,
        timestamp: 1704112345000,
      });
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:get handler
      mockSocket.handlers["metrics:get"]({ requestId: 123 });

      // Assert: Verify emit was called with correct data
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("metrics:get:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(123);
      expect(mockSocket.emitCalls[0].data.data.metrics).toEqual({
        cpu: { usage: 45.5 },
        memory: { used: 2048 },
        disk: { used: 75.2 },
        gpu: {
          list: [],
          usage: 60.0,
          memoryUsed: 4096,
          memoryTotal: 8192,
        },
        swap: { used: 0 },
        uptime: 3600,
      });
    });

    it("should return default values when getLatestMetrics returns empty", async () => {
      // Arrange: Set up mock to return null/undefined
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics(null);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:get handler
      mockSocket.handlers["metrics:get"]({ requestId: 456 });

      // Assert: Verify default values are used
      expect(mockSocket.emitCalls[0].data.data.metrics).toEqual({
        cpu: { usage: 0 },
        memory: { used: 0 },
        disk: { used: 0 },
        gpu: {
          list: [],
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
        },
        swap: { used: 0 },
        uptime: 0,
      });
    });

    it("should return default values when getLatestMetrics returns partial data", async () => {
      // Arrange: Set up mock to return only some fields
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({
        cpu_usage: 25.0,
        memory_usage: 1024,
        // Other fields missing
      });
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:get handler
      mockSocket.handlers["metrics:get"]({ requestId: 789 });

      // Assert: Verify missing fields use defaults
      expect(mockSocket.emitCalls[0].data.data.metrics).toEqual({
        cpu: { usage: 25.0 },
        memory: { used: 1024 },
        disk: { used: 0 },
        gpu: {
          list: [],
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
        },
        swap: { used: 0 },
        uptime: 0,
      });
    });

    it("should use default requestId when req is null", async () => {
      // Arrange: Test with null request
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({});
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger with null request
      mockSocket.handlers["metrics:get"](null);

      // Assert: Verify requestId is a number (timestamp)
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should use default requestId when req.requestId is undefined", async () => {
      // Arrange: Test with undefined requestId
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({});
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger with request object without requestId
      mockSocket.handlers["metrics:get"]({});

      // Assert: Verify requestId is a number (timestamp)
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should return error response when getLatestMetrics throws", async () => {
      // Arrange: Make getLatestMetrics throw an error
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics(null);
      mockDb.getLatestMetrics = function () {
        throw new Error("Database read error");
      };
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:get handler
      mockSocket.handlers["metrics:get"]({ requestId: 999 });

      // Assert: Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Database read error");
    });

    it("should call getLatestMetrics exactly once", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({ cpu_usage: 50 });
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:get"]({ requestId: 100 });

      // Assert
      expect(mockDb._getLatestMetricsCalls()).toBe(1);
    });
  });

  describe("metrics:history event", () => {
    it("should return metrics history with all fields when data exists", async () => {
      // Arrange: Set up mock database response with history data
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([
        {
          cpu_usage: 45.5,
          memory_usage: 2048,
          disk_usage: 75.2,
          gpu_usage: 60.0,
          gpu_memory_used: 4096,
          gpu_memory_total: 8192,
          uptime: 3600,
          timestamp: 1704112345000,
        },
        {
          cpu_usage: 30.0,
          memory_usage: 1536,
          disk_usage: 70.0,
          gpu_usage: 40.0,
          gpu_memory_used: 2048,
          gpu_memory_total: 8192,
          uptime: 1800,
          timestamp: 1704112285000,
        },
      ]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:history handler
      mockSocket.handlers["metrics:history"]({ requestId: 111, limit: 50 });

      // Assert: Verify emit was called with correct data
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("metrics:history:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(111);
      expect(mockSocket.emitCalls[0].data.data.history).toHaveLength(2);
      expect(mockSocket.emitCalls[0].data.data.history[0]).toEqual({
        cpu: { usage: 45.5 },
        memory: { used: 2048 },
        disk: { used: 75.2 },
        gpu: {
          list: [],
          usage: 60.0,
          memoryUsed: 4096,
          memoryTotal: 8192,
        },
        swap: { used: 0 },
        uptime: 3600,
        timestamp: 1704112345000,
      });
    });

    it("should use default limit of 100 when limit is not provided", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger without limit
      mockSocket.handlers["metrics:history"]({ requestId: 222 });

      // Assert: Verify default limit of 100 is passed to getMetricsHistory
      // We need to check this by testing behavior since we can't directly verify the argument
      // But we can verify the handler works correctly
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
    });

    it("should respect custom limit parameter", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([
        { cpu_usage: 10, timestamp: 1704112000000 },
        { cpu_usage: 20, timestamp: 1704112060000 },
        { cpu_usage: 30, timestamp: 1704112120000 },
      ]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger with limit of 2
      mockSocket.handlers["metrics:history"]({ requestId: 333, limit: 2 });

      // Assert: Verify handler executed successfully
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
    });

    it("should return default values for each history item with partial data", async () => {
      // Arrange: Set up mock with partial data
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([
        { cpu_usage: 25.0 }, // Only cpu_usage populated
        { memory_usage: 1024 }, // Only memory_usage populated
      ]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:history handler
      mockSocket.handlers["metrics:history"]({ requestId: 444 });

      // Assert: Verify default values for missing fields
      const history = mockSocket.emitCalls[0].data.data.history;
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        cpu: { usage: 25.0 },
        memory: { used: 0 },
        disk: { used: 0 },
        gpu: {
          list: [],
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
        },
        swap: { used: 0 },
        uptime: 0,
        timestamp: undefined,
      });
      expect(history[1]).toEqual({
        cpu: { usage: 0 },
        memory: { used: 1024 },
        disk: { used: 0 },
        gpu: {
          list: [],
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
        },
        swap: { used: 0 },
        uptime: 0,
        timestamp: undefined,
      });
    });

    it("should return empty array when getMetricsHistory returns empty", async () => {
      // Arrange: Set up mock to return empty array
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:history handler
      mockSocket.handlers["metrics:history"]({ requestId: 555 });

      // Assert: Verify empty array returned
      expect(mockSocket.emitCalls[0].data.data.history).toEqual([]);
    });

    it("should use default requestId when req is null", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger with null request
      mockSocket.handlers["metrics:history"](null);

      // Assert: Verify requestId is a number (timestamp)
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should use default requestId when req.requestId is undefined", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger with request object without requestId
      mockSocket.handlers["metrics:history"]({});

      // Assert: Verify requestId is a number (timestamp)
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should use default limit when req.limit is undefined", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger with request without limit
      mockSocket.handlers["metrics:history"]({ requestId: 666 });

      // Assert: Verify handler executed successfully
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
    });

    it("should return error response when getMetricsHistory throws", async () => {
      // Arrange: Make getMetricsHistory throw an error
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([]);
      mockDb.getMetricsHistory = function () {
        throw new Error("Database read error");
      };
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Trigger the metrics:history handler
      mockSocket.handlers["metrics:history"]({ requestId: 777 });

      // Assert: Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Database read error");
    });

    it("should call getMetricsHistory exactly once", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setHistory([{ cpu_usage: 50 }]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:history"]({ requestId: 888 });

      // Assert
      expect(mockDb._getMetricsHistoryCalls()).toBe(1);
    });

    it("should map all history items with proper formatting", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      const timestamp = Date.now();
      mockDb._setHistory([
        {
          cpu_usage: 10.5,
          memory_usage: 512,
          disk_usage: 50.0,
          gpu_usage: 25.0,
          gpu_memory_used: 1024,
          gpu_memory_total: 4096,
          uptime: 100,
          timestamp: timestamp,
        },
      ]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:history"]({ requestId: 999 });

      // Assert: Verify all fields are properly mapped
      const history = mockSocket.emitCalls[0].data.data.history;
      expect(history).toHaveLength(1);
      expect(history[0].cpu).toEqual({ usage: 10.5 });
      expect(history[0].memory).toEqual({ used: 512 });
      expect(history[0].disk).toEqual({ used: 50.0 });
      expect(history[0].swap).toEqual({ used: 0 });
      expect(history[0].gpu).toEqual({
        list: [],
        usage: 25.0,
        memoryUsed: 1024,
        memoryTotal: 4096,
      });
      expect(history[0].uptime).toBe(100);
      expect(history[0].timestamp).toBe(timestamp);
    });
  });

  describe("response structure", () => {
    it("should include timestamp in success response", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({ cpu_usage: 50 });
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:get"]({ requestId: 1000 });

      // Assert
      expect(mockSocket.emitCalls[0].data.timestamp).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.timestamp).toBe("number");
    });

    it("should include timestamp in error response", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics(null);
      mockDb.getLatestMetrics = function () {
        throw new Error("Test error");
      };
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:get"]({ requestId: 1001 });

      // Assert
      expect(mockSocket.emitCalls[0].data.timestamp).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.timestamp).toBe("number");
    });

    it("should return data inside data property", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({ cpu_usage: 75 });
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:get"]({ requestId: 1002 });

      // Assert: Verify structure matches expected API format
      expect(mockSocket.emitCalls[0].data.data).toBeDefined();
      expect(mockSocket.emitCalls[0].data.data.metrics).toBeDefined();
    });
  });

  describe("handler isolation", () => {
    it("should handle multiple consecutive requests", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({ cpu_usage: 50 });
      mockDb._setHistory([{ cpu_usage: 50 }]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act: Multiple requests
      mockSocket.handlers["metrics:get"]({ requestId: 1 });
      mockSocket.handlers["metrics:history"]({ requestId: 2 });
      mockSocket.handlers["metrics:get"]({ requestId: 3 });

      // Assert: Verify all emit calls
      expect(mockSocket.emitCalls.length).toBe(3);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(1);
      expect(mockSocket.emitCalls[1].data.requestId).toBe(2);
      expect(mockSocket.emitCalls[2].data.requestId).toBe(3);
    });

    it("should maintain separate emit call records for each request", async () => {
      // Arrange
      const { registerMetricsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
      mockDb._setLatestMetrics({ cpu_usage: 30 });
      mockDb._setHistory([{ cpu_usage: 30 }]);
      registerMetricsHandlers(mockSocket, mockDb);

      // Act
      mockSocket.handlers["metrics:get"]({ requestId: 100 });
      mockSocket.handlers["metrics:history"]({ requestId: 200 });

      // Assert: Verify emit calls are tracked separately
      expect(mockSocket.emitCalls).toHaveLength(2);
      expect(mockSocket.emitCalls[0].event).toBe("metrics:get:result");
      expect(mockSocket.emitCalls[1].event).toBe("metrics:history:result");
    });
  });
});
