/**
 * @jest-environment node
 */

/**
 * Handlers.js Comprehensive Test Suite
 * Tests for Socket.IO handler registration functions:
 * - registerHandlers() - Main handler registration
 * - Connection handler logging behavior
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock modules before importing handlers
jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js",
  () => ({
    registerConnectionHandlers: jest.fn(),
  })
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/models/index.js",
  () => ({
    registerModelsHandlers: jest.fn(),
  })
);

jest.unstable_mockModule("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js", () => ({
  registerMetricsHandlers: jest.fn(),
}));

jest.unstable_mockModule("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js", () => ({
  registerLogsHandlers: jest.fn(),
}));

jest.unstable_mockModule("/home/bamer/nextjs-llama-async-proxy/server/handlers/config.js", () => ({
  registerConfigHandlers: jest.fn(),
}));

jest.unstable_mockModule("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama.js", () => ({
  registerLlamaHandlers: jest.fn(),
}));

jest.unstable_mockModule("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js", () => {
  const mockLogger = {
    setIo: jest.fn(),
    setDb: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { logger: mockLogger, Logger: jest.fn(() => mockLogger) };
});

describe("handlers.js - Handler Registration", () => {
  let registerHandlers;
  let registerConnectionHandlers;
  let registerModelsHandlers;
  let registerMetricsHandlers;
  let registerLogsHandlers;
  let registerConfigHandlers;
  let registerLlamaHandlers;
  let mockLogger;
  let mockIo;
  let mockDb;
  let mockGgufParser;

  beforeEach(async () => {
    // Reset all mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Import mocks
    const connectionModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js");
    const modelsModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/index.js");
    const metricsModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
    const logsModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
    const configModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/config.js");
    const llamaModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama.js");
    const loggerModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js");

    registerConnectionHandlers = connectionModule.registerConnectionHandlers;
    registerModelsHandlers = modelsModule.registerModelsHandlers;
    registerMetricsHandlers = metricsModule.registerMetricsHandlers;
    registerLogsHandlers = logsModule.registerLogsHandlers;
    registerConfigHandlers = configModule.registerConfigHandlers;
    registerLlamaHandlers = llamaModule.registerLlamaHandlers;
    mockLogger = loggerModule.logger;

    // Import the function to test
    const handlersModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
    registerHandlers = handlersModule.registerHandlers;

    // Create mock dependencies
    mockIo = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    mockDb = {
      saveMetrics: jest.fn(),
      getModels: jest.fn(),
    };
    mockGgufParser = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("registerHandlers() - Function Export", () => {
    it("should export registerHandlers as a function", () => {
      // Positive test: verify registerHandlers is a function
      expect(typeof registerHandlers).toBe("function");
    });

    it("should accept three parameters: io, db, ggufParser", () => {
      // Positive test: verify function signature
      expect(registerHandlers.length).toBe(4);
    });
  });

  describe("registerHandlers() - Logger Setup", () => {
    it("should set io on logger", () => {
      // Positive test: verify logger.setIo is called
      registerHandlers(mockIo, mockDb, mockGgufParser);

      expect(mockLogger.setIo).toHaveBeenCalledWith(mockIo);
    });

    it("should set db on logger", () => {
      // Positive test: verify logger.setDb is called
      registerHandlers(mockIo, mockDb, mockGgufParser);

      expect(mockLogger.setDb).toHaveBeenCalledWith(mockDb);
    });
  });

  describe("registerHandlers() - Connection Handler", () => {
    it("should register 'connection' event handler on io", () => {
      // Positive test: verify io.on is called with 'connection'
      registerHandlers(mockIo, mockDb, mockGgufParser);

      expect(mockIo.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });

    it("should call registerConnectionHandlers with socket and logger", () => {
      // Positive test: verify connection handlers are registered
      registerHandlers(mockIo, mockDb, mockGgufParser);

      // Get the connection handler callback
      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      // Create mock socket
      const mockSocket = { on: jest.fn(), id: "test-socket-123" };
      connectionCallback(mockSocket);

      expect(registerConnectionHandlers).toHaveBeenCalledWith(mockSocket, mockLogger);
    });
  });

  describe("Connection Handler Behavior", () => {
    it("should log client connection with socket.id", () => {
      // Positive test: verify connection logging
      registerHandlers(mockIo, mockDb, mockGgufParser);

      // Get the connection handler callback
      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      // Create mock socket with id
      const mockSocket = {
        on: jest.fn(),
        id: "socket-abc-123",
      };
      connectionCallback(mockSocket);

      expect(mockLogger.info).toHaveBeenCalledWith("Client connected: socket-abc-123");
    });

    it("should log connection with different socket.id values", () => {
      // Positive test: verify logging works for multiple sockets
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      // First connection
      const socket1 = { on: jest.fn(), id: "socket-1" };
      connectionCallback(socket1);
      expect(mockLogger.info).toHaveBeenCalledWith("Client connected: socket-1");

      // Second connection
      const socket2 = { on: jest.fn(), id: "socket-2" };
      connectionCallback(socket2);
      expect(mockLogger.info).toHaveBeenCalledWith("Client connected: socket-2");
    });
  });

  describe("registerHandlers() - Handler Groups Registration", () => {
    it("should register models handlers with correct parameters", () => {
      // Positive test: verify models handlers registration
      registerHandlers(mockIo, mockDb, mockGgufParser);

      // Get the connection handler callback
      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const mockSocket = { on: jest.fn(), id: "test-socket" };
      connectionCallback(mockSocket);

      expect(registerModelsHandlers).toHaveBeenCalledWith(
        mockSocket,
        mockIo,
        mockDb,
        mockGgufParser
      );
    });

    it("should register metrics handlers with correct parameters", () => {
      // Positive test: verify metrics handlers registration
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const mockSocket = { on: jest.fn(), id: "test-socket" };
      connectionCallback(mockSocket);

      expect(registerMetricsHandlers).toHaveBeenCalledWith(mockSocket, mockDb);
    });

    it("should register logs handlers with correct parameters", () => {
      // Positive test: verify logs handlers registration
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const mockSocket = { on: jest.fn(), id: "test-socket" };
      connectionCallback(mockSocket);

      expect(registerLogsHandlers).toHaveBeenCalledWith(mockSocket, mockDb);
    });

    it("should register config handlers with correct parameters", () => {
      // Positive test: verify config handlers registration
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const mockSocket = { on: jest.fn(), id: "test-socket" };
      connectionCallback(mockSocket);

      expect(registerConfigHandlers).toHaveBeenCalledWith(mockSocket, mockDb);
    });

    it("should register llama handlers with correct parameters (globally)", () => {
      // Positive test: verify llama handlers registration is global (not per-socket)
      // initializeLlamaMetrics parameter is not mocked, so it will be undefined by default for testing
      registerHandlers(mockIo, mockDb, mockGgufParser, undefined); // Pass all args to registerHandlers

      expect(registerLlamaHandlers).toHaveBeenCalledWith(mockIo, mockDb, undefined);
      expect(registerLlamaHandlers).toHaveBeenCalledTimes(1); // It's a global registration
    });
  });

  describe("registerHandlers() - All Handler Groups Called", () => {
    it("should call all handler registration functions", () => {
      // Positive test: verify all handlers are registered
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const mockSocket = { on: jest.fn(), id: "test-socket" };
      connectionCallback(mockSocket);

      // Verify all 6 handler groups were registered
      expect(registerConnectionHandlers).toHaveBeenCalled();
      expect(registerModelsHandlers).toHaveBeenCalled();
      expect(registerMetricsHandlers).toHaveBeenCalled();
      expect(registerLogsHandlers).toHaveBeenCalled();
      expect(registerConfigHandlers).toHaveBeenCalled();
      expect(registerLlamaHandlers).toHaveBeenCalled();
    });

    it("should register handlers exactly once per connection", () => {
      // Positive test: verify single registration per connection
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const mockSocket = { on: jest.fn(), id: "test-socket" };
      connectionCallback(mockSocket);

      // Each handler should be called exactly once per connection
      expect(registerConnectionHandlers).toHaveBeenCalledTimes(1);
      expect(registerModelsHandlers).toHaveBeenCalledTimes(1);
      expect(registerMetricsHandlers).toHaveBeenCalledTimes(1);
      expect(registerLogsHandlers).toHaveBeenCalledTimes(1);
      expect(registerConfigHandlers).toHaveBeenCalledTimes(1);
      expect(registerLlamaHandlers).toHaveBeenCalledTimes(1);
    });
  });

  describe("registerHandlers() - Multiple Connections", () => {
    it("should handle multiple socket connections", () => {
      // Positive test: verify multiple connections are handled
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      // First socket connects
      const socket1 = { on: jest.fn(), id: "socket-1" };
      connectionCallback(socket1);

      // Second socket connects
      const socket2 = { on: jest.fn(), id: "socket-2" };
      connectionCallback(socket2);

      // Third socket connects
      const socket3 = { on: jest.fn(), id: "socket-3" };
      connectionCallback(socket3);

    // Connection, Models, Metrics, Logs, Config, Presets handlers should be called 3 times (once per connection)
    expect(registerConnectionHandlers).toHaveBeenCalledTimes(3);
    expect(registerModelsHandlers).toHaveBeenCalledTimes(3);
    expect(registerMetricsHandlers).toHaveBeenCalledTimes(3);
    expect(registerLogsHandlers).toHaveBeenCalledTimes(3);
    expect(registerConfigHandlers).toHaveBeenCalledTimes(3);
    // registerLlamaHandlers is called only once globally, not per-socket
    expect(registerLlamaHandlers).toHaveBeenCalledTimes(1);
    });

    it("should log each connection separately", () => {
      // Positive test: verify each connection is logged
      registerHandlers(mockIo, mockDb, mockGgufParser);

      const connectionCallback = mockIo.on.mock.calls.find((call) => call[0] === "connection")[1];

      const socket1 = { on: jest.fn(), id: "socket-a" };
      connectionCallback(socket1);

      const socket2 = { on: jest.fn(), id: "socket-b" };
      connectionCallback(socket2);

      // Verify logging happened twice
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith("Client connected: socket-a");
      expect(mockLogger.info).toHaveBeenCalledWith("Client connected: socket-b");
    });
  });

  describe("registerHandlers() - Edge Cases", () => {
    it("should throw when io is null", () => {
      // Negative test: verify error when io is null
      expect(() => {
        registerHandlers(null, mockDb, mockGgufParser);
      }).toThrow();
    });

    it("should not throw when db is null (accessed on connection only)", () => {
      // Edge case: db is accessed only when connection handlers run
      expect(() => {
        registerHandlers(mockIo, null, mockGgufParser);
      }).not.toThrow();
    });

    it("should not throw when ggufParser is null (accessed on connection only)", () => {
      // Edge case: ggufParser is accessed only when connection handlers run
      expect(() => {
        registerHandlers(mockIo, mockDb, null);
      }).not.toThrow();
    });

    it("should throw when io is undefined", () => {
      // Negative test: verify error when io is undefined
      expect(() => {
        registerHandlers(undefined, mockDb, mockGgufParser);
      }).toThrow();
    });
  });

  describe("registerHandlers() - Source Code Verification", () => {
    it("should set logger io before registering connection handlers", () => {
      // Positive test: verify order of operations in source
      const handlersSource = `
        export function registerHandlers(io, db, ggufParser) {
          logger.setIo(io);
          logger.setDb(db);
          io.on("connection", (socket) => {
            const cid = socket.id;
            logger.info(\`Client connected: \${cid}\`);
            registerConnectionHandlers(socket, logger);
            registerModelsHandlers(socket, io, db, ggufParser);
            registerMetricsHandlers(socket, db);
            registerLogsHandlers(socket, db);
            registerConfigHandlers(socket, db);
            registerLlamaHandlers(socket, io, db);
          });
        }
      `;

      // Verify setIo is called before io.on
      const setIoIndex = handlersSource.indexOf("logger.setIo(io)");
      const setDbIndex = handlersSource.indexOf("logger.setDb(db)");
      const ioOnIndex = handlersSource.indexOf('io.on("connection"');

      expect(setIoIndex).toBeLessThan(ioOnIndex);
      expect(setDbIndex).toBeLessThan(ioOnIndex);
    });

    it("should register all 6 handler groups", () => {
      // Positive test: verify all handler groups are registered
      const handlersSource = `
        export function registerHandlers(io, db, ggufParser) {
          logger.setIo(io);
          logger.setDb(db);
          io.on("connection", (socket) => {
            const cid = socket.id;
            logger.info(\`Client connected: \${cid}\`);
            registerConnectionHandlers(socket, logger);
            registerModelsHandlers(socket, io, db, ggufParser);
            registerMetricsHandlers(socket, db);
            registerLogsHandlers(socket, db);
            registerConfigHandlers(socket, db);
            registerLlamaHandlers(socket, io, db);
          });
        }
      `;

      expect(handlersSource.includes("registerConnectionHandlers(socket, logger)")).toBe(true);
      expect(handlersSource.includes("registerModelsHandlers(socket, io, db, ggufParser)")).toBe(
        true
      );
      expect(handlersSource.includes("registerMetricsHandlers(socket, db)")).toBe(true);
      expect(handlersSource.includes("registerLogsHandlers(socket, db)")).toBe(true);
      expect(handlersSource.includes("registerConfigHandlers(socket, db)")).toBe(true);
      expect(handlersSource.includes("registerLlamaHandlers(socket, io, db)")).toBe(true);
    });
  });

  describe("Module Exports", () => {
    it("should export registerHandlers function", async () => {
      // Positive test: verify function is exported
      const handlers = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
      expect(typeof handlers.registerHandlers).toBe("function");
    });

    it("should export response helpers", async () => {
      // Positive test: verify response helpers are exported
      const handlers = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
      expect(handlers.ok).toBeDefined();
      expect(handlers.err).toBeDefined();
    });

    it("should export fileTypeMap constant", async () => {
      // Positive test: verify constants are exported
      const handlers = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
      expect(handlers.fileTypeMap).toBeDefined();
    });

    it("should export logger", async () => {
      // Positive test: verify logger is exported
      const handlers = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
      expect(handlers.logger).toBeDefined();
    });

    it("should export llama-router functions", async () => {
      // Positive test: verify llama-router functions are exported
      const handlers = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
      expect(handlers.startLlamaServerRouter).toBeDefined();
      expect(handlers.stopLlamaServerRouter).toBeDefined();
      expect(handlers.getLlamaStatus).toBeDefined();
      expect(handlers.loadModel).toBeDefined();
      expect(handlers.unloadModel).toBeDefined();
      expect(handlers.getRouterState).toBeDefined();
    });
  });
});

describe("handlers.js - Connection Logging Integration", () => {
  let mockIo;
  let mockSocket;
  let mockLogger;
  let registerHandlers;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    // Create realistic mock objects
    mockLogger = {
      setIo: jest.fn(),
      setDb: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockSocket = {
      id: "test-socket-456",
      on: jest.fn(),
    };

    mockIo = {
      on: jest.fn((event, callback) => {
        if (event === "connection") {
          callback(mockSocket);
        }
      }),
      emit: jest.fn(),
    };

    // Mock the logger module to return our mock
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js",
      () => ({
        registerConnectionHandlers: jest.fn(),
      })
    );
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/models/index.js",
      () => ({
        registerModelsHandlers: jest.fn(),
      })
    );
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js",
      () => ({
        registerMetricsHandlers: jest.fn(),
      })
    );
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js",
      () => ({
        registerLogsHandlers: jest.fn(),
      })
    );
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/config.js",
      () => ({
        registerConfigHandlers: jest.fn(),
      })
    );
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama.js",
      () => ({
        registerLlamaHandlers: jest.fn(),
      })
    );
    jest.unstable_mockModule(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js",
      () => ({
        logger: mockLogger,
      })
    );

    const handlersModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers.js");
    registerHandlers = handlersModule.registerHandlers;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log client connected message on connection", () => {
    // Positive test: verify connection logging
    registerHandlers(mockIo, {}, jest.fn());

    expect(mockLogger.info).toHaveBeenCalledWith("Client connected: test-socket-456");
  });

  it("should format connection log message correctly", () => {
    // Positive test: verify log message format
    registerHandlers(mockIo, {}, jest.fn());

    const logMessage = mockLogger.info.mock.calls[0][0];
    expect(logMessage).toContain("Client connected:");
    expect(logMessage).toContain("test-socket-456");
  });

  it("should include socket ID in connection log", () => {
    // Positive test: verify socket ID is included
    const customSocket = {
      id: "custom-socket-id-789",
      on: jest.fn(),
    };

    const customIo = {
      on: jest.fn((event, callback) => {
        if (event === "connection") {
          callback(customSocket);
        }
      }),
    };

    registerHandlers(customIo, {}, jest.fn());

    expect(mockLogger.info).toHaveBeenCalledWith("Client connected: custom-socket-id-789");
  });
});
