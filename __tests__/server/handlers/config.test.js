/**
 * @jest-environment node
 */

/**
 * Config Handlers Tests
 * Tests for Socket.IO configuration and settings handlers
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

describe("Config Handlers", () => {
  let registerConfigHandlers;
  let mockSocket;
  let mockDb;

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

    // Create fresh mocks for each test
    mockSocket = createMockSocket();
    mockDb = createMockDb();
  });

  describe("registerConfigHandlers", () => {
    it("should register all config and settings event handlers", () => {
      // Arrange: Create socket and db mocks
      const socket = createMockSocket();
      const db = createMockDb();

      // Act: Register handlers
      registerConfigHandlers(socket, db);

      // Assert: All handlers should be registered as functions
      expect(typeof socket.handlers["config:get"]).toBe("function");
      expect(typeof socket.handlers["config:update"]).toBe("function");
      expect(typeof socket.handlers["settings:get"]).toBe("function");
      expect(typeof socket.handlers["settings:update"]).toBe("function");
    });

    it("should not emit anything during registration", () => {
      // Arrange
      const socket = createMockSocket();
      const db = createMockDb();

      // Act: Register handlers
      registerConfigHandlers(socket, db);

      // Assert: No emits should happen during registration
      expect(socket.emitCalls.length).toBe(0);
    });
  });

  describe("config:get event", () => {
    describe("positive tests - correct functionality", () => {
      it("should return config when getConfig succeeds", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger config:get event
        await mockSocket.handlers["config:get"]({});

        // Assert: Should emit success response with config
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("config:get:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.config).toEqual(mockDb.getConfig());
        expect(mockSocket.emitCalls[0].data.data.config.serverPath).toBe(
          "/usr/local/bin/llama-server"
        );
        expect(mockSocket.emitCalls[0].data.data.config.port).toBe(8080);
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 12345;

        // Act: Trigger config:get with requestId
        await mockSocket.handlers["config:get"]({ requestId });

        // Assert: Response should include the requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["config:get"]({});

        // Assert: Response should include timestamp
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(typeof response.timestamp).toBe("number");
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should call db.getConfig to retrieve configuration", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:get"]({});

        // Assert: Should have called getConfig
        expect(mockDb.getConfigCalls.length).toBeGreaterThanOrEqual(1);
      });

      it("should return config with all default values", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:get"]({});

        // Assert: Config should have all expected properties
        const config = mockSocket.emitCalls[0].data.data.config;
        expect(config.serverPath).toBeDefined();
        expect(config.host).toBeDefined();
        expect(config.port).toBeDefined();
        expect(config.baseModelsPath).toBeDefined();
        expect(config.ctx_size).toBeDefined();
        expect(config.batch_size).toBeDefined();
        expect(config.threads).toBeDefined();
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when getConfig throws", async () => {
        // Arrange: Make getConfig throw an error
        mockDb.getConfig = function () {
          throw new Error("Database read error");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:get"]({});

        // Assert: Should emit error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("config:get:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database read error");
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger without requestId
        await mockSocket.handlers["config:get"]({});

        // Assert: Should have a requestId (generated from Date.now())
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
        expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["config:get"](undefined);

        // Assert: Should still emit response with generated requestId
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["config:get"](null);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should return error when db throws specific error types", async () => {
        // Arrange
        mockDb.getConfig = function () {
          throw new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:get"]({});

        // Assert: Should emit error with the specific message
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe(
          "SQLITE_CONSTRAINT: UNIQUE constraint failed"
        );
      });
    });
  });

  describe("config:update event", () => {
    describe("positive tests - correct functionality", () => {
      it("should save config when update succeeds", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const newConfig = { port: 3000, threads: 8 };

        // Act
        await mockSocket.handlers["config:update"]({ config: newConfig });

        // Assert: Should save config and emit success
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual(newConfig);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should return updated config in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const newConfig = { port: 4000, host: "0.0.0.0" };

        // Act
        await mockSocket.handlers["config:update"]({ config: newConfig });

        // Assert: Response should include the updated config
        expect(mockSocket.emitCalls[0].data.data.config).toEqual(newConfig);
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 67890;

        // Act
        await mockSocket.handlers["config:update"]({ config: {}, requestId });

        // Assert
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should save partial config updates", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const partialConfig = { batch_size: 1024 };

        // Act
        await mockSocket.handlers["config:update"]({ config: partialConfig });

        // Assert: Should save partial config
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual(partialConfig);
      });

      it("should save full config with all properties", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const fullConfig = {
          serverPath: "/custom/path/llama-server",
          host: "0.0.0.0",
          port: 8080,
          baseModelsPath: "/custom/models",
          ctx_size: 4096,
          batch_size: 1024,
          threads: 8,
        };

        // Act
        await mockSocket.handlers["config:update"]({ config: fullConfig });

        // Assert
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual(fullConfig);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["config:update"]({ config: {} });

        // Assert
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when saveConfig throws", async () => {
        // Arrange: Make saveConfig throw an error
        mockDb.saveConfig = function () {
          throw new Error("Database write error");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:update"]({ config: { port: 3000 } });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database write error");
      });

      it("should save empty config object when no config provided", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger without config property
        await mockSocket.handlers["config:update"]({});

        // Assert: Should save empty object as default
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });

      it("should save empty config when config is undefined", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger with undefined config
        await mockSocket.handlers["config:update"]({ config: undefined });

        // Assert: Should save empty object
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:update"]({ config: {} });

        // Assert
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle null config gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:update"](null);

        // Assert: Should save empty object (null becomes {})
        expect(mockDb.saveConfigCalls.length).toBe(1);
        expect(mockDb.saveConfigCalls[0]).toEqual({});
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:update"](undefined);

        // Assert: Should save empty object and emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["config:update"](null);

        // Assert
        expect(mockDb.saveConfigCalls.length).toBe(1);
      });
    });
  });

  describe("settings:get event", () => {
    describe("positive tests - correct functionality", () => {
      it("should return empty settings when not set", async () => {
        // Arrange: No settings stored
        mockDb._setSettings(null);
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });

      it("should return stored user settings", async () => {
        // Arrange: Settings are stored
        const storedSettings = { theme: "dark", language: "en" };
        mockDb._setSettings(storedSettings);
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return stored settings
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual(storedSettings);
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 11111;

        // Act
        await mockSocket.handlers["settings:get"]({ requestId });

        // Assert
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should call db.getMeta to retrieve settings", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should have called getMeta with user_settings key
        expect(mockDb.getMetaCalls.length).toBeGreaterThanOrEqual(1);
        expect(mockDb.getMetaCalls).toContain("user_settings");
      });

      it("should return complex nested settings object", async () => {
        // Arrange: Complex settings structure
        const complexSettings = {
          theme: "light",
          notifications: {
            email: true,
            push: false,
            frequency: "daily",
          },
          display: {
            density: "comfortable",
            fontSize: 14,
          },
        };
        mockDb._setSettings(complexSettings);
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual(complexSettings);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when getMeta throws", async () => {
        // Arrange: Make getMeta throw an error
        mockDb.getMeta = function () {
          throw new Error("Meta table access error");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Meta table access error");
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should return empty object when getMeta returns undefined", async () => {
        // Arrange: getMeta returns undefined
        mockDb.getMeta = function () {
          return undefined;
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"](undefined);

        // Assert
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"](null);

        // Assert
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle empty settings object correctly", async () => {
        // Arrange: Empty object stored as settings
        mockDb._setSettings({});
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:get"]({});

        // Assert: Should return empty object (not null/undefined)
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual({});
      });
    });
  });

  describe("settings:update event", () => {
    describe("positive tests - correct functionality", () => {
      it("should save settings when update succeeds", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const newSettings = { theme: "dark" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Should save settings and emit success
        expect(mockDb.setMetaCalls.length).toBe(1);
        expect(mockDb.setMetaCalls[0].key).toBe("user_settings");
        expect(mockDb.setMetaCalls[0].value).toEqual(newSettings);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should return updated settings in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const newSettings = { language: "es", theme: "light" };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: newSettings });

        // Assert: Response should include the updated settings
        expect(mockSocket.emitCalls[0].data.data.settings).toEqual(newSettings);
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const requestId = 22222;

        // Act
        await mockSocket.handlers["settings:update"]({ settings: {}, requestId });

        // Assert
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should call setMeta with correct key and value", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const settingsToSave = { notifications: true, fontSize: 16 };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: settingsToSave });

        // Assert
        expect(mockDb.setMetaCalls.length).toBe(1);
        expect(mockDb.setMetaCalls[0]).toEqual({
          key: "user_settings",
          value: settingsToSave,
        });
      });

      it("should save complex nested settings", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const complexSettings = {
          ui: {
            theme: "dark",
            density: "compact",
          },
          behavior: {
            autoRefresh: true,
            refreshInterval: 30,
          },
        };

        // Act
        await mockSocket.handlers["settings:update"]({ settings: complexSettings });

        // Assert
        expect(mockDb.setMetaCalls[0].value).toEqual(complexSettings);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["settings:update"]({ settings: {} });

        // Assert
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should overwrite previous settings", async () => {
        // Arrange: Start with some settings
        mockDb._setSettings({ theme: "light", language: "en" });
        registerConfigHandlers(mockSocket, mockDb);
        mockDb._resetCalls();

        // Act: Update with new settings
        await mockSocket.handlers["settings:update"]({ settings: { theme: "dark" } });

        // Assert: Should overwrite (not merge)
        expect(mockDb.setMetaCalls[0].value).toEqual({ theme: "dark" });
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when setMeta throws", async () => {
        // Arrange: Make setMeta throw an error
        mockDb.setMeta = function () {
          throw new Error("Meta table write error");
        };
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: { theme: "dark" } });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Meta table write error");
      });

      it("should save empty settings object when no settings provided", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act: Trigger without settings property
        await mockSocket.handlers["settings:update"]({});

        // Assert: Should save empty object as default
        expect(mockDb.setMetaCalls.length).toBe(1);
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should save empty settings when settings is undefined", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: undefined });

        // Assert: Should save empty object
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: {} });

        // Assert
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle null settings gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"]({ settings: null });

        // Assert: Should save empty object
        expect(mockDb.setMetaCalls[0].value).toEqual({});
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"](undefined);

        // Assert: Should save empty object and emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerConfigHandlers(mockSocket, mockDb);

        // Act
        await mockSocket.handlers["settings:update"](null);

        // Assert
        expect(mockDb.setMetaCalls.length).toBe(1);
      });
    });
  });

  describe("response format", () => {
    it("should include all required fields in success response", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act
      await mockSocket.handlers["config:get"]({ requestId: 999 });

      // Assert: Success response should have all required fields
      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(response).toHaveProperty("requestId", 999);
      expect(response).toHaveProperty("timestamp");
      expect(response.data).toHaveProperty("config");
    });

    it("should include all required fields in error response", async () => {
      // Arrange
      mockDb.getConfig = function () {
        throw new Error("Test error");
      };
      registerConfigHandlers(mockSocket, mockDb);

      // Act
      await mockSocket.handlers["config:get"]({ requestId: 888 });

      // Assert: Error response should have all required fields
      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("message");
      expect(response).toHaveProperty("requestId", 888);
      expect(response).toHaveProperty("timestamp");
    });

    it("should include timestamp as number", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act
      await mockSocket.handlers["config:get"]({});

      // Assert
      const response = mockSocket.emitCalls[0].data;
      expect(typeof response.timestamp).toBe("number");
      expect(response.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("integration scenarios", () => {
    it("should handle multiple consecutive config updates", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act: First update
      await mockSocket.handlers["config:update"]({ config: { port: 3000 } });
      // Second update
      await mockSocket.handlers["config:update"]({ config: { port: 4000 } });
      // Third update
      await mockSocket.handlers["config:update"]({ config: { port: 5000 } });

      // Assert: All updates should be saved
      expect(mockDb.saveConfigCalls.length).toBe(3);
      expect(mockDb.saveConfigCalls[0].port).toBe(3000);
      expect(mockDb.saveConfigCalls[1].port).toBe(4000);
      expect(mockDb.saveConfigCalls[2].port).toBe(5000);
    });

    it("should handle getting config after updating", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act: Update config
      await mockSocket.handlers["config:update"]({ config: { port: 3000 } });
      mockDb._resetCalls();

      // Then get config
      await mockSocket.handlers["config:get"]({});

      // Assert: Should retrieve the updated config
      expect(mockDb.getConfigCalls.length).toBeGreaterThanOrEqual(1);
      const config = mockSocket.emitCalls[0].data.data.config;
      expect(config.port).toBe(3000);
    });

    it("should handle settings round-trip (get after update)", async () => {
      // Arrange
      registerConfigHandlers(mockSocket, mockDb);

      // Act: Update settings
      await mockSocket.handlers["settings:update"]({ settings: { theme: "dark" } });
      mockDb._resetCalls();

      // Then get settings
      await mockSocket.handlers["settings:get"]({});

      // Assert: Should retrieve the updated settings
      expect(mockDb.getMetaCalls).toContain("user_settings");
      const settings = mockSocket.emitCalls[0].data.data.settings;
      expect(settings.theme).toBe("dark");
    });
  });
});
