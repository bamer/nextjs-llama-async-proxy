/**
 * @jest-environment node
 */

/**
 * Config Handlers Branch Coverage Tests
 * Tests for uncovered branches in Socket.IO configuration handlers
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock the fileLogger module before importing config handlers
jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js",
  () => ({
    fileLogger: {
      logLevel: "info",
    },
  })
);

describe("Config Handlers - Branch Coverage", () => {
  let registerConfigHandlers;
  let mockSocket;
  let mockDb;
  let mockFileLogger;

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

  // Helper to create mock db with tracking
  function createMockDb() {
    let config = {
      serverPath: "/usr/local/bin/llama-server",
      host: "localhost",
      port: 8080,
      baseModelsPath: "/models",
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
    };
    let userSettings = null;
    const getConfigCalls = [];
    const saveConfigCalls = [];
    const getMetaCalls = [];
    const setMetaCalls = [];

    return {
      getConfig: function () {
        getConfigCalls.push("getConfig");
        return config;
      },
      saveConfig: function (newConfig) {
        saveConfigCalls.push(newConfig);
        config = { ...config, ...newConfig };
      },
      getMeta: function (key) {
        getMetaCalls.push(key);
        if (key === "user_settings") {
          return userSettings;
        }
        return null;
      },
      setMeta: function (key, value) {
        setMetaCalls.push({ key, value });
        if (key === "user_settings") {
          userSettings = value;
        }
      },
      _setConfig: function (newConfig) {
        config = newConfig;
      },
      _setSettings: function (settings) {
        userSettings = settings;
      },
      _resetCalls: function () {
        getConfigCalls.length = 0;
        saveConfigCalls.length = 0;
        getMetaCalls.length = 0;
        setMetaCalls.length = 0;
      },
      getConfigCalls,
      saveConfigCalls,
      getMetaCalls,
      setMetaCalls,
    };
  }

  beforeEach(async () => {
    // Import the module before each test
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/config.js");
    registerConfigHandlers = module.registerConfigHandlers;

    // Import the mock fileLogger
    const loggerModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
    mockFileLogger = loggerModule.fileLogger;

    // Create fresh mocks for each test
    mockSocket = createMockSocket();
    mockDb = createMockDb();

    // Reset fileLogger state
    mockFileLogger.logLevel = "info";
  });

  describe("config:get - branch coverage", () => {
    describe("positive tests - covered branches", () => {
      it("should use requestId from req object (req.requestId is truthy)", async () => {
        // Arrange: Test the branch where req?.requestId returns a truthy value
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 123456;

        // Act: Trigger config:get with explicit requestId
        await mockSocket.handlers["config:get"]({ requestId });

        // Assert: Should use the provided requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should use Date.now() fallback when requestId is undefined", async () => {
        // Arrange: Test the branch where req?.requestId is undefined (|| triggers fallback)
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act: Trigger config:get without requestId
        await mockSocket.handlers["config:get"]({});

        // Assert: Should use Date.now() as fallback
        const response = mockSocket.emitCalls[0].data;
        expect(response.requestId).toBeDefined();
        expect(response.requestId).toBeGreaterThanOrEqual(beforeCall);
        expect(typeof response.requestId).toBe("number");
      });

      it("should use Date.now() fallback when requestId is null", async () => {
        // Arrange: Test the branch where req?.requestId is null (|| triggers fallback)
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act: Trigger config:get with null requestId
        await mockSocket.handlers["config:get"]({ requestId: null });

        // Assert: Should use Date.now() as fallback
        const response = mockSocket.emitCalls[0].data;
        expect(response.requestId).toBeDefined();
        expect(response.requestId).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should use Date.now() fallback when requestId is 0", async () => {
        // Arrange: Test the branch where req?.requestId is 0 (|| triggers fallback since 0 is falsy)
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act: Trigger config:get with requestId = 0
        await mockSocket.handlers["config:get"]({ requestId: 0 });

        // Assert: Should use Date.now() as fallback
        const response = mockSocket.emitCalls[0].data;
        expect(response.requestId).toBeDefined();
        expect(response.requestId).toBeGreaterThanOrEqual(beforeCall);
      });
    });

    describe("negative tests - error handling branches", () => {
      it("should handle getConfig error and emit error response", async () => {
        // Arrange: Force getConfig to throw
        mockDb.getConfig = function () {
          throw new Error("Config read failure");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:get"]({});

        // Assert: Should emit error response with correct format
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("config:get:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Config read failure");
        expect(mockSocket.emitCalls[0].data.timestamp).toBeDefined();
      });

      it("should handle undefined req parameter", async () => {
        // Arrange: req is undefined
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["config:get"](undefined);

        // Assert: Should still work (req?.requestId handles undefined)
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.config).toBeDefined();
      });

      it("should handle null req parameter", async () => {
        // Arrange: req is null
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["config:get"](null);

        // Assert: Should still work (req?.requestId handles null)
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });
    });
  });

  describe("config:update - branch coverage", () => {
    describe("positive tests - covered branches", () => {
      it("should save config and use provided requestId", async () => {
        // Arrange: Test with explicit requestId
        registerConfigHandlers(mockSocket, mockDb);
        const newConfig = { port: 8081, threads: 8 };
        const requestId = 987654;

        // Act
        await mockSocket.handlers["config:update"]({ config: newConfig, requestId });

        // Assert: Should save config and use provided requestId
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual(newConfig);
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should use Date.now() fallback when requestId is missing", async () => {
        // Arrange: Test the || fallback branch for requestId
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act: Trigger without requestId
        await mockSocket.handlers["config:update"]({ config: { port: 3000 } });

        // Assert: Should use Date.now() as fallback
        const response = mockSocket.emitCalls[0].data;
        expect(response.requestId).toBeDefined();
        expect(response.requestId).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should save empty config when config is undefined", async () => {
        // Arrange: Test the req?.config || {} branch when config is undefined
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with undefined config
        await mockSocket.handlers["config:update"]({ config: undefined });

        // Assert: Should save empty object
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });

      it("should save empty config when config is missing entirely", async () => {
        // Arrange: Test req?.config when config property doesn't exist
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger without config property
        await mockSocket.handlers["config:update"]({});

        // Assert: Should save empty object (|| fallback)
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });

      it("should save config when config is null", async () => {
        // Arrange: Test the || fallback when config is null
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with null config
        await mockSocket.handlers["config:update"]({ config: null });

        // Assert: Should save empty object (|| fallback)
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });
    });

    describe("negative tests - error handling branches", () => {
      it("should handle saveConfig error and emit error response", async () => {
        // Arrange: Force saveConfig to throw
        mockDb.saveConfig = function () {
          throw new Error("Config write failure");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:update"]({ config: { port: 3000 } });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Config write failure");
      });

      it("should handle undefined req parameter", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["config:update"](undefined);

        // Assert: Should save empty object and emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });

      it("should handle null req parameter", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["config:update"](null);

        // Assert: Should save empty object
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });
    });
  });

  describe("settings:get - branch coverage", () => {
    describe("positive tests - covered branches", () => {
      it("should use requestId from req object", async () => {
        // Arrange: Test truthy branch for req?.requestId
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 111222;

        // Act
        await mockSocket.handlers["settings:get"]({ requestId });

        // Assert: Should use provided requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should use Date.now() fallback when requestId is missing", async () => {
        // Arrange: Test the || fallback
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should use Date.now() as fallback
        const response = mockSocket.emitCalls[0].data;
        expect(response.requestId).toBeDefined();
        expect(response.requestId).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should return empty object when getMeta returns null", async () => {
        // Arrange: Test the || {} fallback when getMeta returns null
        mockDb._setSettings(null);
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object (|| fallback)
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });

      it("should return empty object when getMeta returns undefined", async () => {
        // Arrange: Test the || {} fallback when getMeta returns undefined
        mockDb.getMeta = function () {
          return undefined;
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object (|| fallback)
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });

      it("should return empty object when getMeta returns empty string", async () => {
        // Arrange: Test the || {} fallback when getMeta returns falsy empty string
        mockDb.getMeta = function () {
          return "";
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object (|| fallback)
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });

      it("should return empty object when getMeta returns 0", async () => {
        // Arrange: Test the || {} fallback when getMeta returns falsy 0
        mockDb.getMeta = function () {
          return 0;
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object (|| fallback)
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });

      it("should return stored settings when getMeta returns object", async () => {
        // Arrange: Test the truthy branch (getMeta returns truthy value)
        const storedSettings = { theme: "dark", language: "en" };
        mockDb._setSettings(storedSettings);
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return stored settings (no || fallback)
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual(storedSettings);
      });
    });

    describe("negative tests - error handling branches", () => {
      it("should handle getMeta error and emit error response", async () => {
        // Arrange: Force getMeta to throw
        mockDb.getMeta = function () {
          throw new Error("Meta read failure");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Meta read failure");
      });

      it("should handle undefined req parameter", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"](undefined);

        // Assert: Should still work
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null req parameter", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"](null);

        // Assert: Should still work
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });
    });
  });

  describe("settings:update - branch coverage", () => {
    describe("positive tests - covered branches", () => {
      it("should use requestId from req object", async () => {
        // Arrange: Test truthy branch for req?.requestId
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 333444;
        const newSettings = { theme: "dark" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings, requestId });

        // Assert: Should use provided requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should use Date.now() fallback when requestId is missing", async () => {
        // Arrange: Test the || fallback
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["settings:update"]({ settings: { theme: "light" } });

        // Assert: Should use Date.now() as fallback
        const response = mockSocket.emitCalls[0].data;
        expect(response.requestId).toBeDefined();
        expect(response.requestId).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should save empty settings when settings is undefined", async () => {
        // Arrange: Test req?.settings || {} when settings is undefined
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: undefined });

        // Assert: Should save empty object
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should save empty settings when settings is missing", async () => {
        // Arrange: Test req?.settings when settings property doesn't exist
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({});

        // Assert: Should save empty object (|| fallback)
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should save empty settings when settings is null", async () => {
        // Arrange: Test || fallback when settings is null
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: null });

        // Assert: Should save empty object (|| fallback)
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should save empty settings when settings is empty string", async () => {
        // Arrange: Test || fallback when settings is falsy empty string
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: "" });

        // Assert: Should save empty object (|| fallback)
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should save empty settings when settings is 0", async () => {
        // Arrange: Test || fallback when settings is falsy 0
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: 0 });

        // Assert: Should save empty object (|| fallback)
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should update fileLogger.logLevel when logLevel is provided", async () => {
        // Arrange: Test the if (settings.logLevel) branch - TRUE case
        registerConfigHandlers(mockSocket, mockDb);
        const newSettings = { logLevel: "debug" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should update fileLogger.logLevel
        expect(mockFileLogger.logLevel).toBe("debug");
        expect(mockDb.setMetaCalls[0].value).toEqual(newSettings);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should update fileLogger.logLevel to 'error' level", async () => {
        // Arrange: Test logLevel update with error level
        registerConfigHandlers(mockSocket, mockDb);
        const newSettings = { logLevel: "error" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should update fileLogger.logLevel
        expect(mockFileLogger.logLevel).toBe("error");
      });

      it("should update fileLogger.logLevel to 'warn' level", async () => {
        // Arrange: Test logLevel update with warn level
        registerConfigHandlers(mockSocket, mockDb);
        const newSettings = { logLevel: "warn" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should update fileLogger.logLevel
        expect(mockFileLogger.logLevel).toBe("warn");
      });

      it("should NOT update fileLogger.logLevel when logLevel is not provided", async () => {
        // Arrange: Test the if (settings.logLevel) branch - FALSE case
        registerConfigHandlers(mockSocket, mockDb);
        mockFileLogger.logLevel = "info"; // Reset to known state
        const newSettings = { theme: "dark", language: "en" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should NOT change fileLogger.logLevel
        expect(mockFileLogger.logLevel).toBe("info");
        expect(mockDb.setMetaCalls[0].value).toEqual(newSettings);
      });

      it("should NOT update fileLogger.logLevel when logLevel is empty string", async () => {
        // Arrange: Test the if (settings.logLevel) branch - FALSE case (falsy)
        registerConfigHandlers(mockSocket, mockDb);
        mockFileLogger.logLevel = "info";
        const newSettings = { logLevel: "" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should NOT change fileLogger.logLevel (empty string is falsy)
        expect(mockFileLogger.logLevel).toBe("info");
      });

      it("should NOT update fileLogger.logLevel when logLevel is null", async () => {
        // Arrange: Test the if (settings.logLevel) branch - FALSE case (falsy)
        registerConfigHandlers(mockSocket, mockDb);
        mockFileLogger.logLevel = "info";
        const newSettings = { logLevel: null };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should NOT change fileLogger.logLevel (null is falsy)
        expect(mockFileLogger.logLevel).toBe("info");
      });

      it("should NOT update fileLogger.logLevel when logLevel is undefined", async () => {
        // Arrange: Test the if (settings.logLevel) branch - FALSE case (falsy)
        registerConfigHandlers(mockSocket, mockDb);
        mockFileLogger.logLevel = "info";
        const newSettings = { logLevel: undefined };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should NOT change fileLogger.logLevel (undefined is falsy)
        expect(mockFileLogger.logLevel).toBe("info");
      });

      it("should NOT update fileLogger.logLevel when logLevel is 0", async () => {
        // Arrange: Test the if (settings.logLevel) branch - FALSE case (falsy)
        registerConfigHandlers(mockSocket, mockDb);
        mockFileLogger.logLevel = "info";
        const newSettings = { logLevel: 0 };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should NOT change fileLogger.logLevel (0 is falsy)
        expect(mockFileLogger.logLevel).toBe("info");
      });

      it("should NOT update fileLogger.logLevel when logLevel is false", async () => {
        // Arrange: Test the if (settings.logLevel) branch - FALSE case (falsy)
        registerConfigHandlers(mockSocket, mockDb);
        mockFileLogger.logLevel = "info";
        const newSettings = { logLevel: false };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should NOT change fileLogger.logLevel (false is falsy)
        expect(mockFileLogger.logLevel).toBe("info");
      });

      it("should update logLevel alongside other settings", async () => {
        // Arrange: Test updating logLevel with other settings
        registerConfigHandlers(mockSocket, mockDb);
        const newSettings = {
          theme: "dark",
          language: "es",
          logLevel: "trace",
        };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should update logLevel and save all settings
        expect(mockFileLogger.logLevel).toBe("trace");
        expect(mockDb.setMetaCalls[0].value).toEqual(newSettings);
      });
    });

    describe("negative tests - error handling branches", () => {
      it("should handle setMeta error and emit error response", async () => {
        // Arrange: Force setMeta to throw
        mockDb.setMeta = function () {
          throw new Error("Meta write failure");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: { theme: "dark" } });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Meta write failure");
      });

      it("should handle undefined req parameter", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"](undefined);

        // Assert: Should save empty object and emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should handle null req parameter", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"](null);

        // Assert: Should save empty object
        expect(mockDb.setMetaCalls.length).toBe(1);
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });
    });
  });

  describe("integration - multiple handler interactions", () => {
    it("should handle rapid config and settings updates", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act: Multiple rapid updates
      await mockSocket.handlers["config:update"]({ config: { port: 9000 } });
      await mockSocket.handlers["settings:update"]({ settings: { logLevel: "debug" } });
      await mockSocket.handlers["config:update"]({ config: { threads: 16 } });
      await mockSocket.handlers["settings:update"]({ settings: { theme: "light" } });

      // Assert: All updates should be processed
      expect(mockDb.saveConfigCalls.length).toBe(2);
      expect(mockDb.setMetaCalls.length).toBe(2);
      expect(mockFileLogger.logLevel).toBe("debug");
    });

    it("should preserve fileLogger.logLevel when updating non-logLevel settings", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);
      mockFileLogger.logLevel = "error";

      // Act: Update settings without logLevel
      await mockSocket.handlers["settings:update"]({ settings: { theme: "compact" } });

      // Assert: logLevel should remain unchanged
      expect(mockFileLogger.logLevel).toBe("error");
    });

    it("should handle empty config update after logLevel change", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act: First update with logLevel, then empty update
      await mockSocket.handlers["settings:update"]({ settings: { logLevel: "silly" } });
      mockDb._resetCalls();

      await mockSocket.handlers["settings:update"]({ settings: {} });

      // Assert: logLevel should remain from first update, empty settings saved
      expect(mockFileLogger.logLevel).toBe("silly");
      expect(mockDb.setMetaCalls[0].value).toEqual({});
    });
  });
});
