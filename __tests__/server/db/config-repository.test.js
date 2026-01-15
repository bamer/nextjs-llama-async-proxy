/**
 * Config Repository Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("ConfigRepository", () => {
  let ConfigRepository;
  let repository;
  let mockDb;
  let mockPrepare;
  let mockRun;
  let mockGet;

  beforeAll(async () => {
    const module = await import("../../../server/db/config-repository.js");
    ConfigRepository = module.ConfigRepository;
  });

  beforeEach(() => {
    mockRun = jest.fn();
    mockGet = jest.fn();
    mockPrepare = jest.fn().mockReturnValue({
      run: mockRun,
      get: mockGet,
    });
    mockDb = {
      prepare: mockPrepare,
    };
    repository = new ConfigRepository(mockDb);
  });

  describe("DEFAULT_CONFIG", () => {
    it("should have ConfigRepository and repository defined", () => {
      expect(ConfigRepository).toBeDefined();
      expect(repository).toBeDefined();
    });
  });

  describe("get()", () => {
    describe("positive tests - correct functionality", () => {
      it("should return DEFAULT_CONFIG when no saved config exists", () => {
        // Arrange: No saved config in database
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get();

        // Assert: Should return default config with all expected values
        expect(result).toEqual({
          serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
          host: "localhost",
          port: 8080,
          baseModelsPath: expect.any(String),
          ctx_size: 2048,
          batch_size: 512,
          threads: 4,
          llama_server_enabled: true,
          llama_server_port: 8080,
          llama_server_host: "0.0.0.0",
          llama_server_metrics: true,
        });
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
        expect(result.host).toBe("localhost");
        expect(result.port).toBe(8080);
        expect(result.ctx_size).toBe(2048);
        expect(result.batch_size).toBe(512);
        expect(result.threads).toBe(4);
      });

      it("should merge saved config with defaults", () => {
        // Arrange: Database has saved config with partial values
        const savedConfig = { host: "0.0.0.0", port: 3000 };
        mockGet.mockReturnValue({ value: JSON.stringify(savedConfig) });

        // Act
        const result = repository.get();

        // Assert: Should merge saved values with defaults
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
        expect(result.host).toBe("0.0.0.0");
        expect(result.port).toBe(3000);
        expect(result.ctx_size).toBe(2048);
        expect(result.batch_size).toBe(512);
        expect(result.threads).toBe(4);
      });

      it("should allow new config values not in defaults", () => {
        // Arrange: Saved config has additional properties
        const savedConfig = {
          customSetting: "value",
          anotherSetting: 123,
        };
        mockGet.mockReturnValue({ value: JSON.stringify(savedConfig) });

        // Act
        const result = repository.get();

        // Assert: Should include custom settings
        expect(result.customSetting).toBe("value");
        expect(result.anotherSetting).toBe(123);
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
      });

      it("should override multiple defaults with saved config", () => {
        // Arrange: Saved config overrides several defaults
        const savedConfig = {
          serverPath: "/custom/path/llama-server",
          host: "192.168.1.1",
          port: 9000,
          threads: 8,
        };
        mockGet.mockReturnValue({ value: JSON.stringify(savedConfig) });

        // Act
        const result = repository.get();

        // Assert: All overridden values should be from saved config
        expect(result.serverPath).toBe("/custom/path/llama-server");
        expect(result.host).toBe("192.168.1.1");
        expect(result.port).toBe(9000);
        expect(result.threads).toBe(8);
        expect(result.ctx_size).toBe(2048); // Unchanged default
        expect(result.batch_size).toBe(512); // Unchanged default
      });

      it("should handle empty saved config object", () => {
        // Arrange: Saved config is an empty object
        mockGet.mockReturnValue({ value: "{}" });

        // Act
        const result = repository.get();

        // Assert: Should return all defaults
        expect(result).toEqual({
          serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
          host: "localhost",
          port: 8080,
          baseModelsPath: expect.any(String),
          ctx_size: 2048,
          batch_size: 512,
          threads: 4,
          llama_server_enabled: true,
          llama_server_port: 8080,
          llama_server_host: "0.0.0.0",
          llama_server_metrics: true,
        });
      });
    });

    describe("negative tests - error handling", () => {
      it("should return defaults when JSON parse fails", () => {
        // Arrange: Database returns invalid JSON
        mockGet.mockReturnValue({ value: "not valid json{" });

        // Act
        const result = repository.get();

        // Assert: Should return default config (not crash)
        expect(result).toEqual({
          serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
          host: "localhost",
          port: 8080,
          baseModelsPath: expect.any(String),
          ctx_size: 2048,
          batch_size: 512,
          threads: 4,
          llama_server_enabled: true,
          llama_server_port: 8080,
          llama_server_host: "0.0.0.0",
          llama_server_metrics: true,
        });
      });

      it("should return defaults when JSON parse throws error", () => {
        // Arrange: JSON.parse throws an error
        mockGet.mockReturnValue({ value: '{ "incomplete": json' });

        // Act
        const result = repository.get();

        // Assert: Should return default config (not crash)
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
        expect(result.host).toBe("localhost");
        expect(result.port).toBe(8080);
        expect(result.ctx_size).toBe(2048);
        expect(result.batch_size).toBe(512);
        expect(result.threads).toBe(4);
      });

      it("should return defaults when database throws error", () => {
        // Arrange: Database query throws an error
        mockGet.mockImplementation(() => {
          throw new Error("Database error");
        });

        // Act
        const result = repository.get();

        // Assert: Should return default config (not crash)
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
        expect(result.ctx_size).toBe(2048);
        expect(result.threads).toBe(4);
      });

      it("should handle null value in database", () => {
        // Arrange: Database returns null value
        mockGet.mockReturnValue({ value: null });

        // Act
        const result = repository.get();

        // Assert: Should return default config
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
        expect(result.port).toBe(8080);
      });

      it("should handle undefined returned from query", () => {
        // Arrange: Query returns undefined (no row found)
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get();

        // Assert: Should return default config
        expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
        expect(result.batch_size).toBe(512);
      });
    });
  });

  describe("save(config)", () => {
    describe("positive tests - correct functionality", () => {
      it("should store config as JSON in database", () => {
        // Arrange
        const config = { port: 3000, host: "0.0.0.0" };

        // Act
        repository.save(config);

        // Assert: Should call prepare with correct query and stringify config
        expect(mockPrepare).toHaveBeenCalledWith(
          "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)"
        );
        expect(mockRun).toHaveBeenCalledWith("config", JSON.stringify(config));
      });

      it("should overwrite previous config with new config", () => {
        // Arrange: Save first config
        const config1 = { port: 3000 };
        repository.save(config1);

        // Verify first save
        expect(mockRun).toHaveBeenCalledTimes(1);
        expect(mockRun).toHaveBeenCalledWith("config", JSON.stringify(config1));

        // Act: Save second config (overwrite)
        const config2 = { port: 8080, threads: 8 };
        repository.save(config2);

        // Assert: Should have called run twice with new config
        expect(mockRun).toHaveBeenCalledTimes(2);
        expect(mockRun).toHaveBeenCalledWith("config", JSON.stringify(config2));
      });

      it("should save partial config with only provided keys", () => {
        // Arrange
        const partialConfig = { port: 4000 };

        // Act
        repository.save(partialConfig);

        // Assert: Should save only the provided keys
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual({ port: 4000 });
        expect(savedJson.serverPath).toBeUndefined();
        expect(savedJson.host).toBeUndefined();
      });

      it("should save full config with all keys", () => {
        // Arrange
        const fullConfig = {
          serverPath: "/custom/path/llama-server",
          host: "0.0.0.0",
          port: 8080,
          baseModelsPath: "/models",
          ctx_size: 4096,
          batch_size: 1024,
          threads: 8,
        };

        // Act
        repository.save(fullConfig);

        // Assert: Should save all keys
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual(fullConfig);
      });

      it("should save config with special characters in values", () => {
        // Arrange
        const config = {
          serverPath: '/path/with "quotes" and \\ backslash',
        };

        // Act
        repository.save(config);

        // Assert: Should properly JSON stringify special characters
        const savedJson = mockRun.mock.calls[0][1];
        expect(savedJson).toBe(JSON.stringify(config));
      });

      it("should save config with nested objects", () => {
        // Arrange
        const config = {
          advanced: { nested: { value: 123 } },
        };

        // Act
        repository.save(config);

        // Assert: Should properly stringify nested objects
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual(config);
        expect(savedJson.advanced.nested.value).toBe(123);
      });

      it("should save config with arrays", () => {
        // Arrange
        const config = {
          models: ["model1.gguf", "model2.gguf"],
        };

        // Act
        repository.save(config);

        // Assert: Should properly stringify arrays
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual(config);
        expect(savedJson.models).toEqual(["model1.gguf", "model2.gguf"]);
      });
    });

    describe("negative tests - error handling", () => {
      it("should handle circular reference in config gracefully", () => {
        // Arrange: Config with circular reference
        const circularConfig = { value: "test" };
        circularConfig.self = circularConfig;

        // Act & Assert: Should not throw (JSON.stringify will throw but should be caught by caller)
        // Note: This test documents expected behavior - in practice JSON.stringify throws
        expect(() => {
          repository.save(circularConfig);
        }).toThrow();
      });

      it("should handle database error on save", () => {
        // Arrange: Database throws on run
        mockRun.mockImplementation(() => {
          throw new Error("Database write error");
        });

        const config = { port: 3000 };

        // Act & Assert: Should propagate database error
        expect(() => {
          repository.save(config);
        }).toThrow("Database write error");
      });
    });
  });

  describe("integration scenarios", () => {
    it("should persist config across get and save operations", () => {
      // Arrange: Start with no config
      mockGet.mockReturnValue(undefined);
      const initialConfig = repository.get();
      expect(initialConfig.port).toBe(8080);

      // Act: Save new port
      const newPort = 4000;
      repository.save({ port: newPort });

      // Reset mock for next get call
      mockGet.mockReturnValue({ value: JSON.stringify({ port: newPort }) });

      // Act: Get config again
      const loadedConfig = repository.get();

      // Assert: Should have the new port
      expect(loadedConfig.port).toBe(newPort);
      expect(loadedConfig.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server"); // Default preserved
    });

    it("should preserve other defaults when saving partial config", () => {
      // Arrange: Start with full defaults loaded
      mockGet.mockReturnValue(undefined);
      repository.get();

      // Act: Save only port change
      repository.save({ port: 5000 });

      // Verify save was called with only the partial config
      const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
      expect(savedJson.port).toBe(5000);
      expect(savedJson.serverPath).toBeUndefined();
      expect(savedJson.host).toBeUndefined();

      // Next get with the saved config
      mockGet.mockReturnValue({ value: JSON.stringify({ port: 5000 }) });
      const result = repository.get();

      // Assert: Merged result has new port but other defaults
      expect(result.port).toBe(5000);
      expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
      expect(result.host).toBe("localhost");
      expect(result.ctx_size).toBe(2048);
    });
  });

  describe("default config values", () => {
    it("should have correct serverPath default", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.serverPath).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
    });

    it("should have correct host default", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.host).toBe("localhost");
    });

    it("should have correct port default", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.port).toBe(8080);
    });

    it("should have correct ctx_size default", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.ctx_size).toBe(2048);
    });

    it("should have correct batch_size default", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.batch_size).toBe(512);
    });

    it("should have correct threads default", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.threads).toBe(4);
    });

    it("should have baseModelsPath that includes home directory", () => {
      mockGet.mockReturnValue(undefined);
      const result = repository.get();
      expect(result.baseModelsPath).toContain("models");
      expect(result.baseModelsPath).toContain(
        process.env.HOME || process.env.USERPROFILE || expect.any(String)
      );
    });
  });
});
