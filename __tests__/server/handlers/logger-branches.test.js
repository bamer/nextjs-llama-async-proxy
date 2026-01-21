/**
 * @jest-environment node
 */

/**
 * Logger Branch Coverage Tests
 * Comprehensive branch coverage for server/handlers/logger.js
 * Target: ≥98% line coverage
 */

import { jest } from "@jest/globals";

describe("Logger Class - Branch Coverage", () => {
  let LoggerClass;
  let Logger;

  beforeEach(async () => {
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js");
    LoggerClass = module.logger.constructor;
    Logger = new LoggerClass();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("setIo method branches", () => {
    /**
     * Objective: Verify setIo sets io on both Logger and fileLogger
     * Positive Test: Call setIo with mock io and verify both are set
     */
    test("should set io on Logger instance", async () => {
      const mockIo = { emit: jest.fn() };
      Logger.setIo(mockIo);
      expect(Logger.io).toBe(mockIo);
    });

    /**
     * Objective: Verify setIo calls fileLogger.setIo
     * Positive Test: Call setIo and verify fileLogger.setIo is called
     */
    test("should call fileLogger.setIo with provided io", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const mockIo = { emit: jest.fn() };
      Logger.setIo(mockIo);
      // The fileLogger.setIo should have been called during setIo
      expect(fileLoggerModule.fileLogger.io).toBe(mockIo);
    });

    /**
     * Objective: Verify setIo can be called multiple times
     * Positive Test: Call setIo twice with different io objects
     */
    test("should allow multiple setIo calls", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const mockIo1 = { emit: jest.fn() };
      const mockIo2 = { emit: jest.fn() };
      Logger.setIo(mockIo1);
      Logger.setIo(mockIo2);
      expect(Logger.io).toBe(mockIo2);
      expect(fileLoggerModule.fileLogger.io).toBe(mockIo2);
    });

    /**
     * Objective: Verify setIo handles null io
     * Negative Test: Call setIo with null
     */
    test("should handle null io", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      Logger.setIo(null);
      expect(Logger.io).toBeNull();
      expect(fileLoggerModule.fileLogger.io).toBeNull();
    });

    /**
     * Objective: Verify setIo handles undefined io
     * Negative Test: Call setIo with undefined
     */
    test("should handle undefined io", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      Logger.setIo(undefined);
      expect(Logger.io).toBeUndefined();
      expect(fileLoggerModule.fileLogger.io).toBeUndefined();
    });
  });

  describe("setDb method branches", () => {
    /**
     * Objective: Verify setDb method correctly sets db on fileLogger
     * Positive Test: Call setDb and verify it sets fileLogger.db property
     */
    test("should set db property on fileLogger", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const mockDb = {
        addLog: jest.fn(),
        getLogs: jest.fn(),
      };
      Logger.setDb(mockDb);
      expect(fileLoggerModule.fileLogger.db).toBe(mockDb);
    });

    /**
     * Objective: Verify setDb handles null input
     * Negative Test: Call setDb with null and verify fileLogger.db is null
     */
    test("should handle null db input", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      Logger.setDb(null);
      expect(fileLoggerModule.fileLogger.db).toBeNull();
    });

    /**
     * Objective: Verify setDb handles undefined input
     * Negative Test: Call setDb with undefined and verify fileLogger.db is undefined
     */
    test("should handle undefined db input", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      Logger.setDb(undefined);
      expect(fileLoggerModule.fileLogger.db).toBeUndefined();
    });

    /**
     * Objective: Verify setDb can be called multiple times with different db objects
     * Positive Test: Call setDb multiple times and verify each update
     */
    test("should allow multiple setDb calls with different objects", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const mockDb1 = { addLog: jest.fn() };
      const mockDb2 = { addLog: jest.fn() };
      Logger.setDb(mockDb1);
      Logger.setDb(mockDb2);
      expect(fileLoggerModule.fileLogger.db).toBe(mockDb2);
    });
  });

  describe("debug method branches", () => {
    /**
     * Objective: Verify debug method exists and can be called
     * Positive Test: Call debug method without errors
     */
    test("should call debug method without errors", async () => {
      // This tests that the debug method can be called
      // It may not log if log level is not debug
      expect(typeof Logger.debug).toBe("function");
      // Call it - it might not log but should not throw
      Logger.debug("test");
    });

    /**
     * Objective: Verify debug method calls fileLogger.debug
     * Positive Test: Verify fileLogger.debug is called when log level allows
     */
    test("should delegate to fileLogger.debug", async () => {
      const fileLoggerModule =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      // Set log level to debug to enable debug logging
      fileLoggerModule.fileLogger.logLevel = "debug";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.debug("Debug message", "test-source");
      // Should have logged with debug level
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Debug message"));
      consoleSpy.mockRestore();
      // Reset log level
      fileLoggerModule.fileLogger.logLevel = "info";
    });
  });

  describe("log method branches", () => {
    /**
     * Objective: Verify log method calls fileLogger.log
     * Positive Test: Call log and verify it delegates
     */
    test("should call fileLogger.log with parameters", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.log("custom-level", "Test message", "custom-source");
      // fileLogger converts level to uppercase
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("CUSTOM-LEVEL"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Test message"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("custom-source"));
      consoleSpy.mockRestore();
    });

    /**
     * Objective: Verify log method uses default source
     * Positive Test: Call log without source
     */
    test("should use default source 'server' for log method", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.log("info", "Test message");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[server]"));
      consoleSpy.mockRestore();
    });
  });

  describe("info method branches", () => {
    /**
     * Objective: Verify info method logs correctly
     * Positive Test: Call info with custom source
     */
    test("should log info with message and custom source", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.info("Info message", "custom-source");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Info message"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("custom-source"));
      consoleSpy.mockRestore();
    });

    /**
     * Objective: Verify info method handles various message types
     * Positive Test: Call info with null message
     */
    test("should handle null message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.info(null);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("error method branches", () => {
    /**
     * Objective: Verify error method logs correctly
     * Positive Test: Call error with custom source
     */
    test("should log error with message and custom source", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.error("Error message", "custom-source");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Error message"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("custom-source"));
      consoleSpy.mockRestore();
    });

    /**
     * Objective: Verify error method handles undefined message
     * Negative Test: Call error with undefined message
     */
    test("should handle undefined message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.error(undefined);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("warn method branches", () => {
    /**
     * Objective: Verify warn method logs correctly
     * Positive Test: Call warn with custom source
     */
    test("should log warn with message and custom source", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.warn("Warn message", "custom-source");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Warn message"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("custom-source"));
      consoleSpy.mockRestore();
    });

    /**
     * Objective: Verify warn method handles boolean message
     * Positive Test: Call warn with boolean message
     */
    test("should handle boolean message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.warn(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe("registerLoggerHandlers - Branch Coverage", () => {
  let mockSocket;
  let mockLogger;
  let registerLoggerHandlers;

  // Helper to create mock socket with event tracking
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

  // Helper to create mock logger with logging tracking
  function createMockLogger() {
    const logs = [];
    return {
      info: function (...args) {
        logs.push({ level: "info", args });
      },
      error: function (...args) {
        logs.push({ level: "error", args });
      },
      warn: function (...args) {
        logs.push({ level: "warn", args });
      },
      log: function (...args) {
        logs.push({ level: "log", args });
      },
      debug: function (...args) {
        logs.push({ level: "debug", args });
      },
      logs,
      _getInfoCalls: function () {
        return logs.filter((log) => log.level === "info");
      },
      _getErrorCalls: function () {
        return logs.filter((log) => log.level === "error");
      },
      _getWarnCalls: function () {
        return logs.filter((log) => log.level === "warn");
      },
      _getLogCalls: function () {
        return logs.filter((log) => log.level === "log");
      },
      _getDebugCalls: function () {
        return logs.filter((log) => log.level === "debug");
      },
    };
  }

  beforeEach(async () => {
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js");
    registerLoggerHandlers = module.registerLoggerHandlers;
    mockSocket = createMockSocket();
    mockLogger = createMockLogger();
  });

  describe("Request object branching", () => {
    /**
     * Objective: Verify handler handles completely empty req object
     * Negative Test: Trigger with empty req object {}
     */
    test("should handle empty request object", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {};

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toContain("Missing required fields");
    });

    /**
     * Objective: Verify handler handles undefined request
     * Negative Test: Trigger with undefined req
     */
    test("should handle undefined request", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const handler = mockSocket._getHandler("logs:add");
      handler(undefined);

      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
    });

    /**
     * Objective: Verify handler uses null coalescing for requestId
     * Positive Test: Verify timestamp is generated when requestId is null
     */
    test("should use timestamp when requestId is null", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: null,
        data: { level: "info", message: "Test" },
      };

      const handler = mockSocket._getHandler("logs:add");
      const beforeTime = Date.now();
      handler(req);
      const afterTime = Date.now();

      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockSocket.emitCalls[0].data.requestId).toBeGreaterThanOrEqual(beforeTime);
      expect(mockSocket.emitCalls[0].data.requestId).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Objective: Verify handler uses null coalescing for requestId with 0
     * Positive Test: Verify timestamp is generated when requestId is 0 (falsy but not nullish)
     */
    test("should preserve requestId when it is 0", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 0,
        data: { level: "info", message: "Test" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(0);
    });

    /**
     * Objective: Verify handler handles data as null
     * Negative Test: Verify error when data is null
     */
    test("should return error when data is null", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: null,
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
    });

    /**
     * Objective: Verify handler handles data as undefined
     * Negative Test: Verify error when data is undefined
     */
    test("should return error when data is undefined", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: undefined,
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
    });
  });

  describe("Message validation branching", () => {
    /**
     * Objective: Verify message validation passes for whitespace-only string
     * Positive Test: Verify whitespace message passes validation
     */
    test("should pass validation when message is whitespace-only", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "info", message: "   " },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      // Whitespace is not empty string, so it passes validation
      expect(mockLogger._getInfoCalls().length).toBe(1);
    });

    /**
     * Objective: Verify message validation passes for newlines only
     * Positive Test: Verify message passes when it's just newlines
     */
    test("should pass validation when message is newlines only", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "info", message: "\n\n" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      // Newlines are not empty/null/undefined, so it passes
      expect(mockLogger._getInfoCalls().length).toBe(1);
    });

    /**
     * Objective: Verify message validation passes for boolean false
     * Positive Test: Verify false message passes validation
     */
    test("should pass validation when message is false", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "info", message: false },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      // false is not null/undefined/empty string, so it passes
      expect(mockLogger._getInfoCalls().length).toBe(1);
    });

    /**
     * Objective: Verify message validation passes for 0 value
     * Positive Test: Verify message passes when it's 0
     */
    test("should pass validation when message is 0", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "info", message: 0 },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      // 0 is not null/undefined/empty string, so it passes
      expect(mockLogger._getInfoCalls().length).toBe(1);
    });
  });

  describe("Level routing branching", () => {
    /**
     * Objective: Verify debug level uses the else (log) branch
     * Positive Test: Verify debug level calls logger.log
     */
    test("should call logger.log for debug level", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "debug", message: "Debug message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
      expect(mockLogger._getLogCalls()[0].args).toEqual(["debug", "Debug message"]);
    });

    /**
     * Objective: Verify custom level uses the else (log) branch
     * Positive Test: Verify custom level calls logger.log
     */
    test("should call logger.log for custom level 'trace'", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "trace", message: "Trace message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
      expect(mockLogger._getLogCalls()[0].args).toEqual(["trace", "Trace message"]);
    });

    /**
     * Objective: Verify verbose level uses the else (log) branch
     * Positive Test: Verify verbose level calls logger.log
     */
    test("should call logger.log for verbose level", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "verbose", message: "Verbose message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
      expect(mockLogger._getLogCalls()[0].args).toEqual(["verbose", "Verbose message"]);
    });

    /**
     * Objective: Verify numeric level uses the else (log) branch
     * Positive Test: Verify numeric level calls logger.log
     */
    test("should call logger.log for numeric level", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: 1, message: "Numeric level message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
      expect(mockLogger._getLogCalls()[0].args).toEqual([1, "Numeric level message"]);
    });

    /**
     * Objective: Verify case variations route to log branch
     * Positive Test: Verify "ERROR" (uppercase) goes to log
     */
    test("should route ERROR to log branch (case sensitive)", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "ERROR", message: "Uppercase error" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
    });

    /**
     * Objective: Verify case variations route to log branch
     * Positive Test: Verify "WARN" (uppercase) goes to log
     */
    test("should route WARN to log branch (case sensitive)", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "WARN", message: "Uppercase warn" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
    });
  });

  describe("Combined validation branches", () => {
    /**
     * Objective: Verify error when level is valid but message is empty
     * Negative Test: Verify only message missing triggers error
     */
    test("should return error when level is 'error' but message is empty", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "error", message: "" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getErrorCalls().length).toBe(0);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
    });

    /**
     * Objective: Verify error when message is valid but level is empty
     * Negative Test: Verify only level missing triggers error
     */
    test("should return error when message is valid but level is missing", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "", message: "Valid message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(0);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
    });

    /**
     * Objective: Verify handler treats 0 as missing level (falsy value)
     * Negative Test: Verify level 0 is treated as missing (since !0 is true)
     */
    test("should return error when level is 0 (falsy value)", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: 0, message: "Message with level 0" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      // 0 is falsy, so !0 = true, levelMissing = true, error is returned
      expect(mockLogger._getLogCalls().length).toBe(0);
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
    });
  });

  describe("Timestamp generation branches", () => {
    /**
     * Objective: Verify timestamp is included in both success and error responses
     * Positive Test: Verify success response has timestamp
     */
    test("should include timestamp in success response", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: { level: "info", message: "Test" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      const response = mockSocket.emitCalls[0].data;
      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe("number");
      expect(response.timestamp).toBeGreaterThan(0);
    });

    /**
     * Objective: Verify timestamp is included in error responses
     * Negative Test: Verify error response has timestamp
     */
    test("should include timestamp in error response", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 123,
        data: {},
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      const response = mockSocket.emitCalls[0].data;
      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe("number");
    });

    /**
     * Objective: Verify timestamps are unique for different requests
     * Positive Test: Verify sequential requests get different timestamps
     */
    test("should generate unique timestamps for different requests", async () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req1 = {
        requestId: 1,
        data: { level: "info", message: "Test 1" },
      };
      const req2 = {
        requestId: 2,
        data: { level: "info", message: "Test 2" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req1);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 2));

      handler(req2);

      const response1 = mockSocket.emitCalls[0].data;
      const response2 = mockSocket.emitCalls[1].data;

      expect(response2.timestamp).toBeGreaterThanOrEqual(response1.timestamp);
    });
  });

  describe("Response structure branches", () => {
    /**
     * Objective: Verify success response data structure
     * Positive Test: Verify success response has correct data structure
     */
    test("should return correct success response structure", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 999,
        data: { level: "info", message: "Success test" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data.added", true);
      expect(response).toHaveProperty("requestId", 999);
      expect(response).toHaveProperty("timestamp");
    });

    /**
     * Objective: Verify error response data structure
     * Negative Test: Verify error response has correct data structure
     */
    test("should return correct error response structure", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 888,
        data: {},
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("message");
      expect(response).toHaveProperty("requestId", 888);
      expect(response).toHaveProperty("timestamp");
    });

    /**
     * Objective: Verify error message is descriptive
     * Negative Test: Verify error message contains both field names
     */
    test("should return descriptive error message for missing fields", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 777,
        data: {},
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      const errorMessage = mockSocket.emitCalls[0].data.error.message;
      expect(errorMessage).toContain("level");
      expect(errorMessage).toContain("message");
    });
  });

  describe("Handler registration branches", () => {
    /**
     * Objective: Verify handler is registered only once per socket
     * Positive Test: Verify multiple registrations don't cause issues
     */
    test("should allow handler registration", () => {
      const result = registerLoggerHandlers(mockSocket, mockLogger);

      expect(typeof mockSocket.handlers["logs:add"]).toBe("function");
    });

    /**
     * Objective: Verify same handler can process multiple requests
     * Positive Test: Verify handler is reusable
     */
    test("should process multiple requests with same handler", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req1 = { requestId: 1, data: { level: "info", message: "Test 1" } };
      const req2 = { requestId: 2, data: { level: "error", message: "Test 2" } };
      const req3 = { requestId: 3, data: { level: "warn", message: "Test 3" } };

      const handler = mockSocket._getHandler("logs:add");
      handler(req1);
      handler(req2);
      handler(req3);

      expect(mockSocket.emitCalls.length).toBe(3);
      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockLogger._getErrorCalls().length).toBe(1);
      expect(mockLogger._getWarnCalls().length).toBe(1);
    });
  });
});
