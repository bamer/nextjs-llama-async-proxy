import fs from "fs";
import path from "path";
import {
  getModelTemplatesConfig,
  invalidateModelTemplatesCache,
  updateModelTemplatesConfig,
} from "@/lib/model-templates-config";

// Mock fs
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock path
jest.mock("path", () => ({
  join: jest.fn(),
}));

// Mock console
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
};
global.console = mockConsole as any;

describe("model-templates-config", () => {
  const mockConfigPath = "/mock/path/model-templates.json";
  const mockConfig = { model_templates: { test: "value" } };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup path.join mock
    (path.join as jest.Mock).mockReturnValue(mockConfigPath);

    // Reset module cache by calling invalidate
    invalidateModelTemplatesCache();
  });

  describe("getModelTemplatesConfig", () => {
    it("should load config from file on first call", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      const result = getModelTemplatesConfig();

      expect(path.join).toHaveBeenCalledWith(
        process.cwd(),
        "src/config/model-templates.json"
      );
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, "utf-8");
      expect(result).toEqual(mockConfig);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "[Model Templates Config] Loaded from file into memory cache"
      );
    });

    it("should return cached config on subsequent calls", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      // First call
      getModelTemplatesConfig();
      // Second call
      const result = getModelTemplatesConfig();

      expect(fs.readFileSync).toHaveBeenCalledTimes(1); // Only once
      expect(result).toEqual(mockConfig);
    });

    it("should handle file read error and return default config", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = getModelTemplatesConfig();

      expect(result).toEqual({ model_templates: {} });
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[Model Templates Config] Error loading config from disk:",
        expect.any(Error)
      );
    });

    it("should handle JSON parse error", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue("invalid json");

      const result = getModelTemplatesConfig();

      expect(result).toEqual({ model_templates: {} });
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe("invalidateModelTemplatesCache", () => {
    it("should clear the cache", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      // Load config
      getModelTemplatesConfig();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);

      // Invalidate
      invalidateModelTemplatesCache();

      // Load again - should read file again
      getModelTemplatesConfig();
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "[Model Templates Config] Cache invalidated, will reload from disk"
      );
    });
  });

  describe("updateModelTemplatesConfig", () => {
    it("should update config and persist to disk when cache exists", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      // Load initial config
      getModelTemplatesConfig();

      const updates = { newKey: "newValue" };
      updateModelTemplatesConfig(updates);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({ ...mockConfig, ...updates }, null, 2),
        "utf-8"
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "[Model Templates Config] Updated and persisted to disk"
      );
    });

    it("should throw error when write fails", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("Write failed");
      });

      getModelTemplatesConfig();

      expect(() => updateModelTemplatesConfig({ test: "update" })).toThrow("Write failed");
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[Model Templates Config] Error writing config to disk:",
        expect.any(Error)
      );
    });

    it("should load config first if cache not initialized", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      // Don't load first, call update directly
      updateModelTemplatesConfig({ newProp: "value" });

      expect(fs.readFileSync).toHaveBeenCalled(); // Should load first
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not update if config loading fails", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("Read failed");
      });

      // This should not throw, but also not update
      updateModelTemplatesConfig({ test: "value" });

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});