/**
 * Tests for server/handlers/index.js
 * Tests registerHandlers function to achieve 100% coverage
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock the handler modules before importing the index
jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js",
  () => ({
    registerConnectionHandlers: jest.fn(),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/models/index.js",
  () => ({
    registerModelsHandlers: jest.fn(),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js",
  () => ({
    registerMetricsHandlers: jest.fn(),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js",
  () => ({
    registerLogsHandlers: jest.fn(),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/config.js",
  () => ({
    registerConfigHandlers: jest.fn(),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama.js",
  () => ({
    registerLlamaHandlers: jest.fn(),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js",
  () => {
    const mockLogger = {
      setIo: jest.fn(),
      setDb: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    };
    return {
      logger: mockLogger,
      default: mockLogger,
    };
  },
  { virtual: true }
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js",
  () => ({
    fileLogger: {
      setIo: jest.fn(),
      setDb: jest.fn(),
    },
  }),
  { virtual: true }
);

// Dynamic import of the module under test
let registerHandlers;
let registerConnectionHandlers;
let registerModelsHandlers;
let registerMetricsHandlers;
let registerLogsHandlers;
let registerConfigHandlers;
let registerLlamaHandlers;
let logger;

describe("server/handlers/index.js", () => {
  let mockIo;
  let mockDb;
  let mockGgufParser;
  let mockSocket;

  beforeEach(async () => {
    // Import the mocked modules
    const connectionModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/connection.js");
    const modelsModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/index.js");
    const metricsModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/metrics.js");
    const logsModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logs.js");
    const configModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/config.js");
    const llamaModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama.js");
    const loggerModule = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/logger.js");
    const indexModule = await import("../../../server/handlers/index.js");

    registerConnectionHandlers = connectionModule.registerConnectionHandlers;
    registerModelsHandlers = modelsModule.registerModelsHandlers;
    registerMetricsHandlers = metricsModule.registerMetricsHandlers;
    registerLogsHandlers = logsModule.registerLogsHandlers;
    registerConfigHandlers = configModule.registerConfigHandlers;
    registerLlamaHandlers = llamaModule.registerLlamaHandlers;
    logger = loggerModule.logger;
    registerHandlers = indexModule.registerHandlers;

    // Reset all mocks
    jest.clearAllMocks();

    // Create mock objects
    mockIo = {
      on: jest.fn((event, callback) => {
        if (event === "connection") {
          // Store the callback to simulate connection
          mockIo._connectionCallback = callback;
        }
      }),
      emit: jest.fn(),
    };

    mockDb = {
      getConfig: jest.fn().mockReturnValue({}),
      getMeta: jest.fn().mockReturnValue({}),
      setMeta: jest.fn(),
    };

    mockGgufParser = {
      parseFile: jest.fn(),
    };

    mockSocket = {
      id: "test-socket-123",
      on: jest.fn(),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerHandlers", () => {
    /**
     * Positive test: verify registerHandlers sets up logger correctly with io and db
     * This verifies the objective behavior of setting up the logger with proper dependencies
     */
    it("should set up logger correctly with io and db", () => {
      // Arrange
      const io = mockIo;
      const db = mockDb;
      const ggufParser = mockGgufParser;

      // Act
      registerHandlers(io, db, ggufParser);

      // Assert - verify logger was set up with io and db
      expect(logger.setIo).toHaveBeenCalledWith(io);
      expect(logger.setDb).toHaveBeenCalledWith(db);
    });

    /**
     * Positive test: verify all handler groups are registered on connection
     * This verifies the objective behavior of registering all handler groups
     */
    it("should register all handler groups when connection event fires", () => {
      // Arrange
      const io = mockIo;
      const db = mockDb;
      const ggufParser = mockGgufParser;

      // Act
      registerHandlers(io, db, ggufParser);

      // Simulate connection event
      expect(io.on).toHaveBeenCalledWith("connection", expect.any(Function));
      const connectionCallback = io._connectionCallback;
      expect(connectionCallback).toBeDefined();

      // Act - trigger the connection callback with mock socket
      connectionCallback(mockSocket);

      // Assert - verify all handler groups were registered
      expect(registerConnectionHandlers).toHaveBeenCalledWith(mockSocket, logger);
      expect(registerModelsHandlers).toHaveBeenCalledWith(mockSocket, io, db, ggufParser);
      expect(registerMetricsHandlers).toHaveBeenCalledWith(mockSocket, db);
      expect(registerLogsHandlers).toHaveBeenCalledWith(mockSocket, db);
      expect(registerConfigHandlers).toHaveBeenCalledWith(mockSocket, db);
      expect(registerLlamaHandlers).toHaveBeenCalledWith(mockSocket, io, db);
    });

    /**
     * Negative test: verify handler registration fails gracefully with invalid parameters
     * This verifies the objective behavior of handling improper input with proper error reporting
     */
    it("should fail gracefully when io is null", () => {
      // Arrange
      const io = null;
      const db = mockDb;
      const ggufParser = mockGgufParser;

      // Act & Assert - should throw TypeError when io is null
      expect(() => {
        registerHandlers(io, db, ggufParser);
      }).toThrow(TypeError);
    });

    /**
     * Positive test: verify connection handler logs client connection
     * This verifies the objective behavior of logging when a client connects
     */
    it("should log client connection when socket connects", () => {
      // Arrange
      const io = mockIo;
      const db = mockDb;
      const ggufParser = mockGgufParser;

      // Act
      registerHandlers(io, db, ggufParser);

      // Trigger connection
      const connectionCallback = io._connectionCallback;
      connectionCallback(mockSocket);

      // Assert - verify info was called (connection logging)
      expect(logger.info).toHaveBeenCalled();
    });

    /**
     * Positive test: verify multiple socket connections register handlers for each
     * This verifies the objective behavior of handling multiple concurrent connections
     */
    it("should register handlers for each socket connection", () => {
      // Arrange
      const io = mockIo;
      const db = mockDb;
      const ggufParser = mockGgufParser;

      // Act
      registerHandlers(io, db, ggufParser);

      // Create multiple mock sockets
      const mockSocket1 = { id: "socket-1", on: jest.fn() };
      const mockSocket2 = { id: "socket-2", on: jest.fn() };

      // Trigger connection for first socket
      const connectionCallback = io._connectionCallback;
      connectionCallback(mockSocket1);
      connectionCallback(mockSocket2);

      // Assert - handlers should be called for each connection
      expect(registerConnectionHandlers).toHaveBeenCalledTimes(2);
      expect(registerModelsHandlers).toHaveBeenCalledTimes(2);
    });
  });

  describe("module exports", () => {
    /**
     * Positive test: verify module exports are correct
     * This verifies the objective behavior of proper module structure
     */
    it("should export registerHandlers function", async () => {
      // Arrange
      const indexModule = await import("../../../server/handlers/index.js");

      // Assert
      expect(typeof indexModule.registerHandlers).toBe("function");
    });

    /**
     * Positive test: verify module exports response helpers
     * This verifies the objective behavior of exporting utility functions
     */
    it("should export ok and err response helpers", async () => {
      // Arrange
      const indexModule = await import("../../../server/handlers/index.js");

      // Assert
      expect(typeof indexModule.ok).toBe("function");
      expect(typeof indexModule.err).toBe("function");
    });

    /**
     * Positive test: verify module exports logger
     * This verifies the objective behavior of exposing logger
     */
    it("should export logger", async () => {
      // Arrange
      const indexModule = await import("../../../server/handlers/index.js");

      // Assert
      expect(indexModule.logger).toBeDefined();
      expect(typeof indexModule.logger.info).toBe("function");
    });

    /**
     * Positive test: verify module exports router management functions
     * This verifies the objective behavior of exposing router API
     */
    it("should export router management functions", async () => {
      // Arrange
      const indexModule = await import("../../../server/handlers/index.js");

      // Assert
      expect(typeof indexModule.startLlamaServerRouter).toBe("function");
      expect(typeof indexModule.stopLlamaServerRouter).toBe("function");
      expect(typeof indexModule.getLlamaStatus).toBe("function");
      expect(typeof indexModule.loadModel).toBe("function");
      expect(typeof indexModule.unloadModel).toBe("function");
      expect(typeof indexModule.getRouterState).toBe("function");
    });

    /**
     * Positive test: verify module exports constants
     * This verifies the objective behavior of exposing constants
     */
    it("should export fileTypeMap constant", async () => {
      // Arrange
      const indexModule = await import("../../../server/handlers/index.js");

      // Assert
      expect(indexModule.fileTypeMap).toBeDefined();
      expect(typeof indexModule.fileTypeMap).toBe("object");
    });
  });
});
