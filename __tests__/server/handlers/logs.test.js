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
  });

  describe("logs:read-file event", () => {
    // Positive test: logs:read-file handler is registered
    it("should register logs:read-file event handler", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();

      // Act: Register the handlers
      registerLogsHandlers(mockSocket, mockDb);

      // Assert: Verify logs:read-file handler is registered
      expect(typeof mockSocket.handlers["logs:read-file"]).toBe("function");
    });

    // Positive test: logs:read-file handler can be called without throwing
    it("should execute logs:read-file handler without throwing", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:read-file event
      await mockSocket.handlers["logs:read-file"]({ requestId: 601 });

      // Assert: Verify handler executed and emit was called
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("logs:read-file:result");
      expect(mockSocket.emitCalls[0].data.requestId).toBe(601);
    });

    // Positive test: logs:read-file uses default requestId when not provided
    it("should use default requestId when not provided in request", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:read-file without requestId
      await mockSocket.handlers["logs:read-file"]();

      // Assert: Verify requestId is set
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    // Positive test: logs:read-file handler response has correct structure
    it("should return response with correct structure", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:read-file event
      await mockSocket.handlers["logs:read-file"]({ requestId: 602 });

      // Assert: Verify response structure
      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBeDefined();
      expect(response.requestId).toBe(602);
      expect(response.timestamp).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.logs).toBeDefined();
      expect(response.data.fileName).toBeDefined();
    });

    // Negative test: logs:read-file handles null request object
    it("should handle null request object", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:read-file with null request
      await mockSocket.handlers["logs:read-file"](null);

      // Assert: Verify handler executed with default values
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
    });

    // Negative test: logs:read-file handles errors from fileLogger
    it("should return error response when fileLogger.readLogFile throws", async () => {
      // Arrange: Import the fileLogger module
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const originalReadLogFile = fileLoggerModule.fileLogger.readLogFile;

      // Mock readLogFile to throw an error
      fileLoggerModule.fileLogger.readLogFile = function () {
        throw new Error("File read error");
      };

      try {
        // Arrange: Import the handler and create mocks
        const { registerLogsHandlers } =
          await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
        const mockSocket = createMockSocket();
        const mockDb = createMockDb();
        registerLogsHandlers(mockSocket, mockDb);

        // Act: Trigger logs:read-file event
        await mockSocket.handlers["logs:read-file"]({ requestId: 603 });

        // Assert: Verify error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("File read error");
        expect(mockSocket.emitCalls[0].data.requestId).toBe(603);
      } finally {
        // Restore original readLogFile
        fileLoggerModule.fileLogger.readLogFile = originalReadLogFile;
      }
    });
  });

  describe("logs:list-files event", () => {
    // Positive test: logs:list-files handler is registered
    it("should register logs:list-files event handler", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();

      // Act: Register the handlers
      registerLogsHandlers(mockSocket, mockDb);

      // Assert: Verify logs:list-files handler is registered
      expect(typeof mockSocket.handlers["logs:list-files"]).toBe("function");
    });

    // Positive test: logs:list-files handler can be called without throwing
    it("should execute logs:list-files handler without throwing", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:list-files event
      await mockSocket.handlers["logs:list-files"]({ requestId: 701 });

      // Assert: Verify handler executed and emit was called
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("logs:list-files:result");
      expect(mockSocket.emitCalls[0].data.requestId).toBe(701);
    });

    // Positive test: logs:list-files returns files and size in response
    it("should return files and size in response data", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:list-files event
      await mockSocket.handlers["logs:list-files"]({ requestId: 702 });

      // Assert: Verify response contains files and size
      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBe(true);
      expect(response.data.files).toBeDefined();
      expect(response.data.size).toBeDefined();
      expect(Array.isArray(response.data.files)).toBe(true);
      expect(typeof response.data.size).toBe("number");
    });

    // Positive test: logs:list-files uses default requestId when not provided
    it("should use default requestId when not provided in request", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:list-files without requestId
      await mockSocket.handlers["logs:list-files"]();

      // Assert: Verify requestId is set
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    // Positive test: logs:list-files handler response has correct structure
    it("should return response with correct structure", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:list-files event
      await mockSocket.handlers["logs:list-files"]({ requestId: 703 });

      // Assert: Verify response structure
      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBeDefined();
      expect(response.requestId).toBe(703);
      expect(response.timestamp).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.files).toBeDefined();
      expect(response.data.size).toBeDefined();
    });

    // Negative test: logs:list-files handles null request object
    it("should handle null request object", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:list-files with null request
      await mockSocket.handlers["logs:list-files"](null);

      // Assert: Verify handler executed with default values
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
    });

    // Negative test: logs:list-files handles errors from fileLogger
    it("should return error response when fileLogger.listLogFiles throws", async () => {
      // Arrange: Import the fileLogger module
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const originalListLogFiles = fileLoggerModule.fileLogger.listLogFiles;

      // Mock listLogFiles to throw an error
      fileLoggerModule.fileLogger.listLogFiles = function () {
        throw new Error("Directory read error");
      };

      try {
        // Arrange: Import the handler and create mocks
        const { registerLogsHandlers } =
          await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
        const mockSocket = createMockSocket();
        const mockDb = createMockDb();
        registerLogsHandlers(mockSocket, mockDb);

        // Act: Trigger logs:list-files event
        await mockSocket.handlers["logs:list-files"]({ requestId: 704 });

        // Assert: Verify error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Directory read error");
        expect(mockSocket.emitCalls[0].data.requestId).toBe(704);
      } finally {
        // Restore original listLogFiles
        fileLoggerModule.fileLogger.listLogFiles = originalListLogFiles;
      }
    });
  });

  describe("logs:clear-files event", () => {
    // Positive test: logs:clear-files handler is registered
    it("should register logs:clear-files event handler", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();

      // Act: Register the handlers
      registerLogsHandlers(mockSocket, mockDb);

      // Assert: Verify logs:clear-files handler is registered
      expect(typeof mockSocket.handlers["logs:clear-files"]).toBe("function");
    });

    // Positive test: logs:clear-files handler can be called without throwing
    it("should execute logs:clear-files handler without throwing", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear-files event
      await mockSocket.handlers["logs:clear-files"]({ requestId: 801 });

      // Assert: Verify handler executed and emit was called
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("logs:clear-files:result");
      expect(mockSocket.emitCalls[0].data.requestId).toBe(801);
    });

    // Positive test: logs:clear-files returns cleared count in response
    it("should return cleared count in response data", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear-files event
      await mockSocket.handlers["logs:clear-files"]({ requestId: 802 });

      // Assert: Verify response contains cleared count
      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBe(true);
      expect(response.data.cleared).toBeDefined();
      expect(typeof response.data.cleared).toBe("number");
    });

    // Positive test: logs:clear-files uses default requestId when not provided
    it("should use default requestId when not provided in request", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear-files without requestId
      await mockSocket.handlers["logs:clear-files"]();

      // Assert: Verify requestId is set
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    // Positive test: logs:clear-files handler response has correct structure
    it("should return response with correct structure", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear-files event
      await mockSocket.handlers["logs:clear-files"]({ requestId: 803 });

      // Assert: Verify response structure
      const response = mockSocket.emitCalls[0].data;
      expect(response.success).toBeDefined();
      expect(response.requestId).toBe(803);
      expect(response.timestamp).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.cleared).toBeDefined();
    });

    // Negative test: logs:clear-files handles null request object
    it("should handle null request object", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Trigger logs:clear-files with null request
      await mockSocket.handlers["logs:clear-files"](null);

      // Assert: Verify handler executed with default values
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
    });

    // Positive test: logs:clear-files multiple times
    it("should handle multiple clear calls correctly", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();
      registerLogsHandlers(mockSocket, mockDb);

      // Act: Clear files twice
      await mockSocket.handlers["logs:clear-files"]({ requestId: 804 });
      await mockSocket.handlers["logs:clear-files"]({ requestId: 805 });

      // Assert: Both calls succeeded
      expect(mockSocket.emitCalls[0].data.requestId).toBe(804);
      expect(mockSocket.emitCalls[1].data.requestId).toBe(805);
      expect(mockSocket.emitCalls.length).toBe(2);
      expect(mockSocket.emitCalls[0].event).toBe("logs:clear-files:result");
      expect(mockSocket.emitCalls[1].event).toBe("logs:clear-files:result");
    });

    // Negative test: logs:clear-files handles errors from fileLogger
    it("should return error response when fileLogger.clearLogFiles throws", async () => {
      // Arrange: Import the fileLogger module
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const originalClearLogFiles = fileLoggerModule.fileLogger.clearLogFiles;

      // Mock clearLogFiles to throw an error
      fileLoggerModule.fileLogger.clearLogFiles = function () {
        throw new Error("Clear files error");
      };

      try {
        // Arrange: Import the handler and create mocks
        const { registerLogsHandlers } =
          await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
        const mockSocket = createMockSocket();
        const mockDb = createMockDb();
        registerLogsHandlers(mockSocket, mockDb);

        // Act: Trigger logs:clear-files event
        await mockSocket.handlers["logs:clear-files"]({ requestId: 806 });

        // Assert: Verify error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Clear files error");
        expect(mockSocket.emitCalls[0].data.requestId).toBe(806);
      } finally {
        // Restore original clearLogFiles
        fileLoggerModule.fileLogger.clearLogFiles = originalClearLogFiles;
      }
    });
  });

  describe("All handlers registration", () => {
    // Positive test: verify all 5 handlers are registered correctly
    it("should register all 5 logs event handlers", async () => {
      // Arrange: Import the handler and create mocks
      const { registerLogsHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
      const mockSocket = createMockSocket();
      const mockDb = createMockDb();

      // Act: Register the handlers
      registerLogsHandlers(mockSocket, mockDb);

      // Assert: Verify all 5 event handlers are registered
      expect(typeof mockSocket.handlers["logs:get"]).toBe("function");
      expect(typeof mockSocket.handlers["logs:read-file"]).toBe("function");
      expect(typeof mockSocket.handlers["logs:list-files"]).toBe("function");
      expect(typeof mockSocket.handlers["logs:clear"]).toBe("function");
      expect(typeof mockSocket.handlers["logs:clear-files"]).toBe("function");
    });
  });
});
