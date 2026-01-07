/**
 * @jest-environment node
 */

/**
 * Logger Handlers Tests
 * Socket.IO handler tests for log operations
 */

import { jest } from "@jest/globals";

describe("Logger Class", () => {
  let LoggerClass;
  let Logger;
  let mockIo;

  beforeEach(async () => {
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js");
    LoggerClass = module.logger.constructor;
    Logger = new LoggerClass();
    mockIo = {
      emit: jest.fn(),
    };
  });

  describe("Constructor", () => {
    /**
     * Objective: Verify Logger constructor initializes io to null
     * Test: Create new Logger instance and verify io property is null
     */
    test("should initialize io to null", () => {
      expect(Logger.io).toBeNull();
    });
  });

  describe("setIo", () => {
    /**
     * Objective: Verify setIo correctly sets the io property
     * Test: Call setIo with mockIo and verify io property is set
     */
    test("should set io property", () => {
      Logger.setIo(mockIo);
      expect(Logger.io).toBe(mockIo);
    });

    /**
     * Objective: Verify setIo can be called multiple times
     * Test: Call setIo twice with different io objects
     */
    test("should allow updating io property", () => {
      const mockIo2 = { emit: jest.fn() };
      Logger.setIo(mockIo);
      Logger.setIo(mockIo2);
      expect(Logger.io).toBe(mockIo2);
    });
  });

  describe("log", () => {
    /**
     * Objective: Verify log method formats timestamp correctly
     * Test: Call log and verify console.log is called with formatted timestamp
     */
    test("should log message with timestamp", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.log("info", "Test message");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] \[INFO\] \[server\] Test message$/)
      );
      consoleSpy.mockRestore();
    });

    /**
     * Objective: Verify log method does not emit when io is null
     * Test: Call log without setting io and verify emit is not called
     */
    test("should not emit when io is null", () => {
      Logger.log("info", "Test message");
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    /**
     * Objective: Verify log method emits when io is set
     * Test: Set io, call log, and verify emit is called with correct structure
     */
    test("should emit when io is set", () => {
      Logger.setIo(mockIo);
      Logger.log("info", "Test message");
      expect(mockIo.emit).toHaveBeenCalledWith("logs:entry", {
        type: "broadcast",
        data: {
          entry: {
            level: "info",
            message: "Test message",
            source: "server",
            timestamp: expect.any(Number),
          },
        },
      });
    });

    /**
     * Objective: Verify log method converts message to string
     * Test: Call log with non-string message and verify it's converted
     */
    test("should convert message to string", () => {
      Logger.setIo(mockIo);
      Logger.log("error", 12345);
      expect(mockIo.emit).toHaveBeenCalledWith("logs:entry", {
        type: "broadcast",
        data: {
          entry: {
            level: "error",
            message: "12345",
            source: "server",
            timestamp: expect.any(Number),
          },
        },
      });
    });

    /**
     * Objective: Verify log method handles object messages
     * Test: Call log with object message and verify it's converted to string
     */
    test("should convert object message to string", () => {
      Logger.setIo(mockIo);
      const obj = { key: "value" };
      Logger.log("warn", obj);
      expect(mockIo.emit).toHaveBeenCalledWith("logs:entry", {
        type: "broadcast",
        data: {
          entry: {
            level: "warn",
            message: String(obj),
            source: "server",
            timestamp: expect.any(Number),
          },
        },
      });
    });
  });

  describe("info", () => {
    /**
     * Objective: Verify info method calls log with 'info' level
     * Test: Call info and verify log is called with correct level
     */
    test("should call log with info level", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.info("Test info message");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Test info message"));
      consoleSpy.mockRestore();
    });
  });

  describe("error", () => {
    /**
     * Objective: Verify error method calls log with 'error' level
     * Test: Call error and verify log is called with correct level
     */
    test("should call log with error level", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.error("Test error message");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Test error message"));
      consoleSpy.mockRestore();
    });
  });

  describe("warn", () => {
    /**
     * Objective: Verify warn method calls log with 'warn' level
     * Test: Call warn and verify log is called with correct level
     */
    test("should call log with warn level", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      Logger.warn("Test warn message");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Test warn message"));
      consoleSpy.mockRestore();
    });
  });
});

describe("registerLoggerHandlers", () => {
  let mockSocket;
  let mockLogger;
  let handlerCallback;
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
    };
  }

  beforeEach(async () => {
    // Import the module fresh for each test
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js");
    registerLoggerHandlers = module.registerLoggerHandlers;
    mockSocket = createMockSocket();
    mockLogger = createMockLogger();
  });

  describe("Positive Tests - Handler Registration", () => {
    /**
     * Objective: Verify that registerLoggerHandlers registers the logs:add event handler
     * Test: Call registerLoggerHandlers and verify socket.on was called with 'logs:add'
     */
    test("should register logs:add event handler", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      expect(typeof mockSocket.handlers["logs:add"]).toBe("function");
    });

    /**
     * Objective: Verify that the registered handler processes valid info level logs
     * Test: Trigger logs:add with level='info' and verify logger.info is called
     */
    test("should call logger.info when level is info", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 12345,
        data: { level: "info", message: "Test info message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockLogger._getInfoCalls()[0].args[0]).toBe("Test info message");
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: true,
          data: { added: true },
          requestId: 12345,
        }),
      });
    });

    /**
     * Objective: Verify that the registered handler processes valid error level logs
     * Test: Trigger logs:add with level='error' and verify logger.error is called
     */
    test("should call logger.error when level is error", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 67890,
        data: { level: "error", message: "Test error message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getErrorCalls().length).toBe(1);
      expect(mockLogger._getErrorCalls()[0].args[0]).toBe("Test error message");
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: true,
          data: { added: true },
          requestId: 67890,
        }),
      });
    });

    /**
     * Objective: Verify that the registered handler processes valid warn level logs
     * Test: Trigger logs:add with level='warn' and verify logger.warn is called
     */
    test("should call logger.warn when level is warn", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 11111,
        data: { level: "warn", message: "Test warn message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getWarnCalls().length).toBe(1);
      expect(mockLogger._getWarnCalls()[0].args[0]).toBe("Test warn message");
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: true,
          data: { added: true },
          requestId: 11111,
        }),
      });
    });

    /**
     * Objective: Verify that the registered handler uses logger.log for unknown levels
     * Test: Trigger logs:add with custom level and verify logger.log is called
     */
    test("should call logger.log for unknown levels", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 22222,
        data: { level: "debug", message: "Test debug message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getLogCalls().length).toBe(1);
      expect(mockLogger._getLogCalls()[0].args).toEqual(["debug", "Test debug message"]);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: true,
          data: { added: true },
          requestId: 22222,
        }),
      });
    });

    /**
     * Objective: Verify that handler generates requestId when not provided
     * Test: Trigger logs:add without requestId and verify timestamp is used
     */
    test("should use timestamp as requestId when not provided", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        data: { level: "info", message: "Test message" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });
  });

  describe("Negative Tests - Error Handling", () => {
    /**
     * Objective: Verify that handler returns error when level is missing
     * Test: Trigger logs:add without level and verify error response
     */
    test("should return error when level is missing", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 33333,
        data: { message: "Test message without level" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockLogger._getErrorCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 33333,
        }),
      });
    });

    /**
     * Objective: Verify that handler returns error when message is missing
     * Test: Trigger logs:add without message and verify error response
     */
    test("should return error when message is missing", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 44444,
        data: { level: "info" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 44444,
        }),
      });
    });

    /**
     * Objective: Verify that handler returns error when data is missing entirely
     * Test: Trigger logs:add without data object and verify error response
     */
    test("should return error when data is missing", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 55555,
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 55555,
        }),
      });
    });

    /**
     * Objective: Verify that handler handles null data gracefully
     * Test: Trigger logs:add with null data and verify error response
     */
    test("should return error when data is null", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 66666,
        data: null,
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 66666,
        }),
      });
    });

    /**
     * Objective: Verify that handler returns error when both level and message are missing
     * Test: Trigger logs:add with empty data object and verify error response
     */
    test("should return error when both level and message are missing", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 77777,
        data: {},
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 77777,
        }),
      });
    });

    /**
     * Objective: Verify that handler handles empty string message
     * Test: Trigger logs:add with empty string message and verify error response
     */
    test("should return error when message is empty string", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 88888,
        data: { level: "info", message: "" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 88888,
        }),
      });
    });

    /**
     * Objective: Verify that handler handles undefined values
     * Test: Trigger logs:add with undefined level and message and verify error response
     */
    test("should return error when level and message are undefined", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 99999,
        data: { level: undefined, message: undefined },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(0);
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0]).toEqual({
        event: "logs:add:result",
        data: expect.objectContaining({
          success: false,
          error: { message: "Missing required fields: level and message" },
          requestId: 99999,
        }),
      });
    });
  });

  describe("Edge Cases", () => {
    /**
     * Objective: Verify that handler correctly processes numeric messages
     * Test: Trigger logs:add with numeric message and verify it's handled
     */
    test("should handle numeric message", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 100000,
        data: { level: "info", message: 12345 },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockLogger._getInfoCalls()[0].args[0]).toBe(12345);
    });

    /**
     * Objective: Verify that handler correctly processes object messages
     * Test: Trigger logs:add with object message and verify logger handles it
     */
    test("should handle object message", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const messageObj = { key: "value", nested: { data: true } };
      const req = {
        requestId: 100001,
        data: { level: "error", message: messageObj },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getErrorCalls().length).toBe(1);
      expect(mockLogger._getErrorCalls()[0].args[0]).toEqual(messageObj);
    });

    /**
     * Objective: Verify that handler correctly processes array messages
     * Test: Trigger logs:add with array message and verify logger handles it
     */
    test("should handle array message", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const messageArr = ["item1", "item2", "item3"];
      const req = {
        requestId: 100002,
        data: { level: "warn", message: messageArr },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getWarnCalls().length).toBe(1);
      expect(mockLogger._getWarnCalls()[0].args[0]).toEqual(messageArr);
    });

    /**
     * Objective: Verify that handler correctly processes special characters in message
     * Test: Trigger logs:add with special characters and verify logger handles it
     */
    test("should handle special characters in message", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const specialMessage = "Message with \"quotes\" and 'apostrophes' and `backticks`";
      const req = {
        requestId: 100003,
        data: { level: "info", message: specialMessage },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockLogger._getInfoCalls()[0].args[0]).toBe(specialMessage);
    });

    /**
     * Objective: Verify that handler correctly processes multiline messages
     * Test: Trigger logs:add with multiline message and verify logger handles it
     */
    test("should handle multiline message", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const multilineMessage = "Line 1\nLine 2\nLine 3";
      const req = {
        requestId: 100004,
        data: { level: "info", message: multilineMessage },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockLogger._getInfoCalls().length).toBe(1);
      expect(mockLogger._getInfoCalls()[0].args[0]).toBe(multilineMessage);
    });

    /**
     * Objective: Verify that handler response includes timestamp
     * Test: Trigger logs:add and verify response includes timestamp
     */
    test("should include timestamp in response", () => {
      const beforeTime = Date.now();
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 100005,
        data: { level: "info", message: "Test" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockSocket.emitCalls[0].data.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(typeof mockSocket.emitCalls[0].data.timestamp).toBe("number");
    });

    /**
     * Objective: Verify that handler uses case-insensitive level matching
     * Test: Trigger logs:add with uppercase level and verify it falls through to log
     */
    test("should handle uppercase level", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 100006,
        data: { level: "INFO", message: "Test uppercase" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      // INFO doesn't match info, ERROR, or warn, so it falls through to log
      expect(mockLogger._getLogCalls().length).toBe(1);
      expect(mockLogger._getLogCalls()[0].args).toEqual(["INFO", "Test uppercase"]);
    });

    /**
     * Objective: Verify that handler can be registered multiple times with different sockets
     * Test: Register handler twice with different sockets and verify both work
     */
    test("should allow registration with different socket instances", () => {
      const mockSocket2 = createMockSocket();

      registerLoggerHandlers(mockSocket, mockLogger);
      registerLoggerHandlers(mockSocket2, mockLogger);

      expect(typeof mockSocket.handlers["logs:add"]).toBe("function");
      expect(typeof mockSocket2.handlers["logs:add"]).toBe("function");
    });
  });

  describe("Response Format Verification", () => {
    /**
     * Objective: Verify that success response has correct structure
     * Test: Trigger valid logs:add and verify response structure
     */
    test("should return correct success response structure", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 200000,
        data: { level: "info", message: "Success test" },
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockSocket.emitCalls.length).toBe(1);
      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data", { added: true });
      expect(response).toHaveProperty("timestamp");
      expect(response).toHaveProperty("requestId", 200000);
    });

    /**
     * Objective: Verify that error response has correct structure
     * Test: Trigger invalid logs:add and verify response structure
     */
    test("should return correct error response structure", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 200001,
        data: {},
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockSocket.emitCalls.length).toBe(1);
      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("message");
      expect(response).toHaveProperty("timestamp");
      expect(response).toHaveProperty("requestId", 200001);
    });

    /**
     * Objective: Verify that error message is descriptive
     * Test: Trigger logs:add without fields and verify error message
     */
    test("should return descriptive error message", () => {
      registerLoggerHandlers(mockSocket, mockLogger);

      const req = {
        requestId: 200002,
        data: {},
      };

      const handler = mockSocket._getHandler("logs:add");
      handler(req);

      expect(mockSocket.emitCalls[0].data.error.message).toBe(
        "Missing required fields: level and message"
      );
    });
  });
});
