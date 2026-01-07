/**
 * @jest-environment node
 */

/**
 * Connection Handlers Unit Tests
 * Tests for Socket.IO connection lifecycle handlers
 */

describe("Connection Handlers", () => {
  let mockSocket;
  let mockLogger;
  let registerConnectionHandlers;

  // Helper to create mock socket with event tracking
  function createMockSocket(socketId = "test-socket-123") {
    const handlers = {};
    const emitCalls = [];

    return {
      id: socketId,
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
    };
  }

  beforeEach(async () => {
    // Import the module fresh for each test
    const module =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js");
    registerConnectionHandlers = module.registerConnectionHandlers;
    mockSocket = createMockSocket();
    mockLogger = createMockLogger();
  });

  describe("registerConnectionHandlers", () => {
    it("should register connection:ack and disconnect event handlers", async () => {
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js");
      registerConnectionHandlers(mockSocket, mockLogger);

      // Verify handlers were registered
      expect(typeof mockSocket.handlers["connection:ack"]).toBe("function");
      expect(typeof mockSocket.handlers["disconnect"]).toBe("function");
    });

    it("should not emit events before connection:ack is triggered", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // No emits should happen before triggering the handler
      expect(mockSocket.emitCalls.length).toBe(0);
    });
  });

  describe("connection:ack event", () => {
    it("should emit connection:established with clientId when connection:ack is triggered", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger the connection:ack handler
      mockSocket.handlers["connection:ack"]();

      // Verify connection:established was emitted with correct clientId
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("connection:established");
      expect(mockSocket.emitCalls[0].data.clientId).toBe(mockSocket.id);
    });

    it("should emit connection:established with timestamp when connection:ack is triggered", async () => {
      const beforeTime = Date.now();
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger the connection:ack handler
      mockSocket.handlers["connection:ack"]();

      const afterTime = Date.now();

      // Verify timestamp was included and is within expected range
      expect(mockSocket.emitCalls[0].data.timestamp).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.timestamp).toBe("number");
      expect(mockSocket.emitCalls[0].data.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(mockSocket.emitCalls[0].data.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should emit connection:established with correct data structure", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger the connection:ack handler
      mockSocket.handlers["connection:ack"]();

      // Verify complete data structure
      const emittedData = mockSocket.emitCalls[0].data;
      expect(emittedData).toHaveProperty("clientId");
      expect(emittedData).toHaveProperty("timestamp");
      expect(Object.keys(emittedData).length).toBe(2);
    });

    it("should use different socket.id for different connections", async () => {
      const socket1 = createMockSocket("socket-abc-123");
      const socket2 = createMockSocket("socket-xyz-789");

      registerConnectionHandlers(socket1, mockLogger);
      registerConnectionHandlers(socket2, mockLogger);

      // Trigger handlers for both sockets
      socket1.handlers["connection:ack"]();
      socket2.handlers["connection:ack"]();

      // Verify each socket received its own clientId
      expect(socket1.emitCalls[0].data.clientId).toBe("socket-abc-123");
      expect(socket2.emitCalls[0].data.clientId).toBe("socket-xyz-789");
    });
  });

  describe("disconnect event", () => {
    it("should log client disconnection with socket.id and reason", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger disconnect handler with reason
      mockSocket.handlers["disconnect"]("client namespace disconnect");

      // Verify logger was called with correct message
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe("info");
      expect(mockLogger.logs[0].args[0]).toContain("Client disconnected:");
      expect(mockLogger.logs[0].args[0]).toContain(mockSocket.id);
      expect(mockLogger.logs[0].args[0]).toContain("client namespace disconnect");
    });

    it("should handle disconnect with various reason codes", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      const reasons = [
        "io server disconnect",
        "io client disconnect",
        "ping timeout",
        "transport close",
        "transport error",
      ];

      for (const reason of reasons) {
        mockLogger.logs.length = 0; // Clear logs
        mockSocket.handlers["disconnect"](reason);

        expect(mockLogger.logs.length).toBe(1);
        expect(mockLogger.logs[0].args[0]).toContain(reason);
      }
    });

    it("should include socket.id in all disconnect logs", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger disconnect
      mockSocket.handlers["disconnect"]("test reason");

      // Verify the socket id is present in the log message
      const logMessage = mockLogger.logs[0].args[0];
      expect(logMessage).toContain(mockSocket.id);
    });

    it("should not emit any events on disconnect", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger disconnect
      mockSocket.handlers["disconnect"]("test reason");

      // Verify no events were emitted
      expect(mockSocket.emitCalls.length).toBe(0);
    });
  });

  describe("handler execution order", () => {
    it("should handle multiple connection:ack events", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Trigger multiple connection:ack events
      mockSocket.handlers["connection:ack"]();
      mockSocket.handlers["connection:ack"]();
      mockSocket.handlers["connection:ack"]();

      // Verify each event was handled
      expect(mockSocket.emitCalls.length).toBe(3);
      mockSocket.emitCalls.forEach((call, index) => {
        expect(call.event).toBe("connection:established");
        expect(call.data.clientId).toBe(mockSocket.id);
      });
    });

    it("should handle mixed connection:ack and disconnect events", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Simulate connection and disconnection
      mockSocket.handlers["connection:ack"]();
      mockSocket.handlers["disconnect"]("transport close");
      mockSocket.handlers["connection:ack"]();
      mockSocket.handlers["disconnect"]("ping timeout");

      // Verify correct sequence of events
      expect(mockSocket.emitCalls.length).toBe(2);
      expect(mockSocket.emitCalls[0].event).toBe("connection:established");
      expect(mockSocket.emitCalls[1].event).toBe("connection:established");
      expect(mockLogger.logs.length).toBe(2);
      expect(mockLogger.logs[0].args[0]).toContain("transport close");
      expect(mockLogger.logs[1].args[0]).toContain("ping timeout");
    });
  });

  describe("error handling", () => {
    it("should handle connection:ack without crashing", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Multiple rapid calls should not crash
      expect(() => {
        mockSocket.handlers["connection:ack"]();
        mockSocket.handlers["connection:ack"]();
        mockSocket.handlers["connection:ack"]();
      }).not.toThrow();
    });

    it("should handle disconnect without crashing", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Multiple disconnect calls should not crash
      expect(() => {
        mockSocket.handlers["disconnect"]("reason1");
        mockSocket.handlers["disconnect"]("reason2");
        mockSocket.handlers["disconnect"]("reason3");
      }).not.toThrow();
    });

    it("should handle empty reason string", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      // Disconnect with empty reason should not crash
      mockSocket.handlers["disconnect"]("");

      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].args[0]).toContain("Client disconnected:");
      expect(mockLogger.logs[0].args[0]).toContain(mockSocket.id);
    });
  });

  describe("edge cases", () => {
    it("should handle very long socket.id", async () => {
      const longId = "socket-" + "x".repeat(500);
      const longSocket = createMockSocket(longId);
      registerConnectionHandlers(longSocket, mockLogger);

      longSocket.handlers["connection:ack"]();

      expect(longSocket.emitCalls[0].data.clientId).toBe(longId);
      expect(longSocket.emitCalls[0].data.clientId.length).toBe(longId.length);
    });

    it("should handle special characters in socket.id", async () => {
      const specialId = "socket-abc!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const specialSocket = createMockSocket(specialId);
      registerConnectionHandlers(specialSocket, mockLogger);

      specialSocket.handlers["connection:ack"]();

      expect(specialSocket.emitCalls[0].data.clientId).toBe(specialId);
    });

    it("should handle very long disconnect reason", async () => {
      const longReason =
        "This is a very long disconnect reason that might exceed normal length expectations " +
        "x".repeat(500);
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["disconnect"](longReason);

      expect(mockLogger.logs[0].args[0]).toContain(longReason);
    });

    it("should handle unicode characters in disconnect reason", async () => {
      const unicodeReason = "Disconnection reason with unicode: 你好 🌍 🚀 ñáéíóú";
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["disconnect"](unicodeReason);

      expect(mockLogger.logs[0].args[0]).toContain(unicodeReason);
    });

    it("should handle socket.id with unicode characters", async () => {
      const unicodeId = "socket-你好世界-🚀";
      const unicodeSocket = createMockSocket(unicodeId);
      registerConnectionHandlers(unicodeSocket, mockLogger);

      unicodeSocket.handlers["connection:ack"]();

      expect(unicodeSocket.emitCalls[0].data.clientId).toBe(unicodeId);
    });
  });

  describe("logger interaction", () => {
    it("should only use info level for disconnect logging", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["disconnect"]("test reason");

      // Verify only info level was used
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe("info");
      expect(mockLogger.logs[0].level).not.toBe("error");
      expect(mockLogger.logs[0].level).not.toBe("warn");
    });

    it("should not log during connection:ack", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["connection:ack"]();

      // Verify no logging occurred for connection:ack
      expect(mockLogger.logs.length).toBe(0);
    });

    it("should format log message correctly with multiple parts", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["disconnect"]("io server disconnect");

      const logMessage = mockLogger.logs[0].args[0];
      // Should contain all expected parts
      expect(logMessage).toMatch(/Client disconnected:/);
      expect(logMessage).toMatch(/test-socket-123/);
      expect(logMessage).toMatch(/io server disconnect/);
    });
  });

  describe("timestamp behavior", () => {
    it("should generate unique timestamps for each connection:ack", async () => {
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["connection:ack"]();
      const firstTimestamp = mockSocket.emitCalls[0].data.timestamp;

      // Small delay to ensure different timestamp
      const start = Date.now();
      while (Date.now() - start < 10) {}

      mockSocket.handlers["connection:ack"]();
      const secondTimestamp = mockSocket.emitCalls[1].data.timestamp;

      // Timestamps should be different (or at least the second should not be earlier)
      expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
    });

    it("should generate timestamps as Unix epoch milliseconds", async () => {
      const beforeTime = Date.now();
      registerConnectionHandlers(mockSocket, mockLogger);

      mockSocket.handlers["connection:ack"]();
      const timestamp = mockSocket.emitCalls[0].data.timestamp;

      const afterTime = Date.now();

      // Verify it's a reasonable Unix timestamp (epoch milliseconds)
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
      // Should be a value representing milliseconds since 1970
      expect(timestamp).toBeGreaterThan(1609459200000); // Jan 1, 2021
    });
  });
});
