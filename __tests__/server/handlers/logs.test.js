/**
 * @jest-environment node
 */

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("Logs Handlers", () => {
  // Helper to create mock socket with emit tracking
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

  // Helper to create mock db with getLogs and clearLogs
  function createMockDb(initialLogs = []) {
    let logs = [...initialLogs];
    let clearCount = 0;
    return {
      getLogs: function (limit = 100) {
        if (limit !== undefined && limit !== null) {
          return logs.slice(0, limit);
        }
        return logs;
      },
      clearLogs: function () {
        const count = logs.length;
        clearCount++;
        logs = [];
        return count;
      },
      _setLogs: function (newLogs) {
        logs = newLogs;
      },
      _getClearCount: function () {
        return clearCount;
      },
    };
  }

  describe("registerLogsHandlers", () => {
    // Positive test: verify handlers are registered correctly
    it("should register logs:get and logs:clear event handlers", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();

      // Act: Register the handlers
      registerLogsHandlers(mockSocket, mockDb);

      // Assert: Verify both event handlers are registered
      expect(typeof mockSocket.handlers["logs:get"]).toBe("function");
      expect(typeof mockSocket.handlers["logs:clear"]).toBe("function");
    });
  });

  describe("logs:get event", () => {
    // Positive test: logs:get returns logs array with default limit
    it("should return logs array with default limit of 100", async () => {
      // Arrange: Setup with mock logs data
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test log 1", source: "test", timestamp: Date.now() },
        { id: 2, level: "error", message: "Test log 2", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get event
      await mockSocket.handlers["logs:get"]({ requestId: 123 });

      // Assert: Verify emit was called with correct response format
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("logs:get:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.logs).toEqual(mockLogs);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(123);
      expect(mockSocket.emitCalls[0].data.timestamp).toBeDefined();
    });

    // Positive test: logs:get with custom limit parameter
    it("should return limited logs when limit parameter is provided", async () => {
      // Arrange: Setup with many mock logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        level: "info",
        message: `Log ${i + 1}`,
        source: "test",
        timestamp: Date.now(),
      }));
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get with limit of 5
      await mockSocket.handlers["logs:get"]({ requestId: 456, limit: 5 });

      // Assert: Verify only limited logs are returned
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(5);
      expect(mockSocket.emitCalls[0].data.data.logs[0].message).toBe("Log 1");
      expect(mockSocket.emitCalls[0].data.data.logs[4].message).toBe("Log 5");
    });

    // Positive test: logs:get returns empty array when no logs exist
    it("should return empty logs array when no logs in database", async () => {
      // Arrange: Setup with empty mock database
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get event
      await mockSocket.handlers["logs:get"]({ requestId: 789 });

      // Assert: Verify empty array is returned
      expect(mockSocket.emitCalls[0].data.data.logs).toEqual([]);
      expect(Array.isArray(mockSocket.emitCalls[0].data.data.logs)).toBe(true);
    });

    // Positive test: logs:get uses default requestId when not provided
    it("should use default requestId when not provided in request", async () => {
      // Arrange: Setup mocks without requestId
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get without requestId
      await mockSocket.handlers["logs:get"]();

      // Assert: Verify requestId is set (timestamp-based)
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    // Positive test: logs:get passes undefined limit correctly to db
    it("should handle undefined limit gracefully", async () => {
      // Arrange: Setup mocks with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get with undefined limit in request (no limit property)
      await mockSocket.handlers["logs:get"]({ requestId: 100 });

      // Assert: Verify handler executed successfully
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.logs).toEqual(mockLogs);
    });

    // Negative test: logs:get handles database errors gracefully
    it("should return error response when database getLogs throws", async () => {
      // Arrange: Setup mocks with failing database
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      mockDb.getLogs = function () {
        throw new Error("Database read error");
      };
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get event
      await mockSocket.handlers["logs:get"]({ requestId: 999 });

      // Assert: Verify error response format
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Database read error");
      expect(mockSocket.emitCalls[0].data.requestId).toBe(999);
    });

    // Negative test: logs:get handles null request object
    it("should handle null request object", async () => {
      // Arrange: Setup with null request
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get with null request
      await mockSocket.handlers["logs:get"](null);

      // Assert: Verify handler executed with default values
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
    });

    // Positive test: logs:get with limit of 0 uses default limit (100)
    it("should use default limit when limit is 0 (falsy value)", async () => {
      // Arrange: Setup with logs and limit 0
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:get with limit 0
      await mockSocket.handlers["logs:get"]({ requestId: 101, limit: 0 });

      // Assert: Verify default limit is used (0 is falsy, so defaults to 100)
      expect(mockSocket.emitCalls[0].data.data.logs).toEqual(mockLogs);
    });
  });

  describe("logs:clear event", () => {
    // Positive test: logs:clear clears logs and returns count
    it("should clear all logs and return cleared count", async () => {
      // Arrange: Setup with mock logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Log 1", source: "test", timestamp: Date.now() },
        { id: 2, level: "error", message: "Log 2", source: "test", timestamp: Date.now() },
        { id: 3, level: "warn", message: "Log 3", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear event
      await mockSocket.handlers["logs:clear"]({ requestId: 201 });

      // Assert: Verify emit was called with correct response
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("logs:clear:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.cleared).toBe(3);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(201);
      expect(mockSocket.emitCalls[0].data.timestamp).toBeDefined();
    });

    // Positive test: logs:clear returns 0 when no logs exist
    it("should return 0 cleared when no logs in database", async () => {
      // Arrange: Setup with empty database
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear event
      await mockSocket.handlers["logs:clear"]({ requestId: 202 });

      // Assert: Verify 0 is returned
      expect(mockSocket.emitCalls[0].data.data.cleared).toBe(0);
    });

    // Positive test: logs:clear uses default requestId when not provided
    it("should use default requestId when not provided in request", async () => {
      // Arrange: Setup without requestId
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear without requestId
      await mockSocket.handlers["logs:clear"]();

      // Assert: Verify requestId is set
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    // Negative test: logs:clear handles database errors gracefully
    it("should return error response when database clearLogs throws", async () => {
      // Arrange: Setup with failing database
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      mockDb.clearLogs = function () {
        throw new Error("Database clear error");
      };
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear event
      await mockSocket.handlers["logs:clear"]({ requestId: 299 });

      // Assert: Verify error response
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Database clear error");
      expect(mockSocket.emitCalls[0].data.requestId).toBe(299);
    });

    // Negative test: logs:clear handles null request object
    it("should handle null request object", async () => {
      // Arrange: Setup with null request
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear with null request
      await mockSocket.handlers["logs:clear"](null);

      // Assert: Verify handler executed with default values
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
    });

    // Positive test: logs:clear multiple times
    it("should handle multiple clear calls correctly", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Clear logs twice
      await mockSocket.handlers["logs:clear"]({ requestId: 301 });
      await mockSocket.handlers["logs:clear"]({ requestId: 302 });

      // Assert: Both calls succeeded
      expect(mockSocket.emitCalls[0].data.data.cleared).toBe(1);
      expect(mockSocket.emitCalls[1].data.data.cleared).toBe(0);
      expect(mockSocket.emitCalls[1].data.requestId).toBe(302);
    });
  });

  describe("Integration tests", () => {
    // Positive test: full workflow - get logs, clear logs
    it("should handle complete workflow: get logs, then clear logs", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Info message", source: "server", timestamp: Date.now() },
        {
          id: 2,
          level: "error",
          message: "Error message",
          source: "server",
          timestamp: Date.now(),
        },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Get logs first, then clear
      await mockSocket.handlers["logs:get"]({ requestId: 401 });
      await mockSocket.handlers["logs:clear"]({ requestId: 402 });

      // Assert: Both operations succeeded
      expect(mockSocket.emitCalls.length).toBe(2);

      // Verify logs:get result
      expect(mockSocket.emitCalls[0].event).toBe("logs:get:result");
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(2);

      // Verify logs:clear result
      expect(mockSocket.emitCalls[1].event).toBe("logs:clear:result");
      expect(mockSocket.emitCalls[1].data.data.cleared).toBe(2);
    });

    // Positive test: get logs after clear returns empty array
    it("should return empty logs after clear operation", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Clear, then get logs
      await mockSocket.handlers["logs:clear"]({ requestId: 501 });
      await mockSocket.handlers["logs:get"]({ requestId: 502 });

      // Assert: Get after clear returns empty array
      expect(mockSocket.emitCalls[1].data.data.logs).toEqual([]);
    });

    // Positive test: mixed operations with different requestIds
    it("should track requestIds correctly across multiple operations", async () => {
      // Arrange: Setup
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Multiple operations with different requestIds
      await mockSocket.handlers["logs:get"]({ requestId: 1001 });
      await mockSocket.handlers["logs:clear"]({ requestId: 1002 });
      await mockSocket.handlers["logs:get"]({ requestId: 1003, limit: 10 });

      // Assert: All requestIds preserved correctly
      expect(mockSocket.emitCalls[0].data.requestId).toBe(1001);
      expect(mockSocket.emitCalls[1].data.requestId).toBe(1002);
      expect(mockSocket.emitCalls[2].data.requestId).toBe(1003);
    });

    // Positive test: concurrent operations don't interfere
    it("should handle concurrent operations independently", async () => {
      // Arrange: Setup
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Simulate concurrent operations by calling handlers in sequence
      await mockSocket.handlers["logs:get"]({ requestId: 2001 });
      await mockSocket.handlers["logs:clear"]({ requestId: 2002 });

      // Assert: Each operation has its own emit call
      expect(mockSocket.emitCalls.length).toBe(2);
      expect(mockSocket.emitCalls[0].event).toBe("logs:get:result");
      expect(mockSocket.emitCalls[1].event).toBe("logs:clear:result");
    });
  });

  describe("Edge cases", () => {
    // Positive test: handler emits error when db getLogs is undefined
    it("should emit error response when db getLogs is undefined", async () => {
      // Arrange: Setup with incomplete mock db (no getLogs method)
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = {}; // Missing getLogs and clearLogs
      registerLogsHandlers(mockSocket, mockDb);

      // Assert: Handler is registered and should emit error response
      expect(typeof mockSocket.handlers["logs:get"]).toBe("function");
      mockSocket.handlers["logs:get"]({ requestId: 3001 });

      // Should emit error response since db.getLogs is undefined
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error).toBeDefined();
    });

    // Positive test: logs:get with very large limit
    it("should handle very large limit value", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger with very large limit
      await mockSocket.handlers["logs:get"]({ requestId: 3002, limit: 999999 });

      // Assert: Should return all available logs
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(1);
    });

    // Positive test: logs:get with very large limit
    it("should handle very large limit value", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger with very large limit
      await mockSocket.handlers["logs:get"]({ requestId: 3002, limit: 999999 });

      // Assert: Should return all available logs
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(1);
    });

    // Positive test: logs:get with very large limit
    it("should handle very large limit value", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger with very large limit
      await mockSocket.handlers["logs:get"]({ requestId: 3002, limit: 999999 });

      // Assert: Should return all available logs
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(1);
    });

    // Positive test: logs:get with very large limit
    it("should handle very large limit value", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger with very large limit
      await mockSocket.handlers["logs:get"]({ requestId: 3002, limit: 999999 });

      // Assert: Should return all available logs
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(1);
    });

    // Positive test: logs:get with very large limit
    it("should handle very large limit value", async () => {
      // Arrange: Setup with logs
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockLogs = [
        { id: 1, level: "info", message: "Test", source: "test", timestamp: Date.now() },
      ];
      const mockDb = createMockDb(mockLogs);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger with very large limit
      await mockSocket.emitCalls.splice(0); // Clear previous emits
      await mockSocket.handlers["logs:get"]({ requestId: 3002, limit: 999999 });

      // Assert: Should return all available logs
      expect(mockSocket.emitCalls[0].data.data.logs.length).toBe(1);
    });

    // Positive test: response format consistency
    it("should maintain consistent response format across all events", async () => {
      // Arrange: Setup
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb([]);
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger both events
      await mockSocket.handlers["logs:get"]({ requestId: 4001 });
      await mockSocket.handlers["logs:clear"]({ requestId: 4002 });

      // Assert: Verify response format consistency
      const getResponse = mockSocket.emitCalls[0].data;
      const clearResponse = mockSocket.emitCalls[1].data;

      // Both should have these fields
      expect(getResponse.success).toBeDefined();
      expect(getResponse.requestId).toBeDefined();
      expect(getResponse.timestamp).toBeDefined();
      expect(clearResponse.success).toBeDefined();
      expect(clearResponse.requestId).toBeDefined();
      expect(clearResponse.timestamp).toBeDefined();
    });
  });
});
