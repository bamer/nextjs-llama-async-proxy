import fs from "fs";
import {
  getModelTemplatesConfig,
  invalidateModelTemplatesCache,
  updateModelTemplatesConfig,
} from "@/lib/model-templates-config";

jest.mock("fs");

describe("model-templates-config", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    invalidateModelTemplatesCache();
  });

  describe("getModelTemplatesConfig", () => {
    it("should load config from disk on first call", () => {
      const mockConfig = { model_templates: { model1: "template1" } };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      const result = getModelTemplatesConfig();

      expect(result).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it("should return cached config on subsequent calls", () => {
      const mockConfig = { model_templates: { model1: "template1" } };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      getModelTemplatesConfig();
      getModelTemplatesConfig();
      getModelTemplatesConfig();

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid JSON gracefully", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue("invalid json");

      const result = getModelTemplatesConfig();

      expect(result).toEqual({ model_templates: {} });
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Error loading config")
      );
    });

    it("should handle missing file gracefully", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("ENOENT: no such file or directory");
      });

      const result = getModelTemplatesConfig();

      expect(result).toEqual({ model_templates: {} });
    });

    it("should return default structure on error", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("Read error");
      });

      const result = getModelTemplatesConfig();

      expect(result).toHaveProperty("model_templates");
      expect(typeof result).toBe("object");
    });
  });

  describe("invalidateModelTemplatesCache", () => {
    it("should clear cache", () => {
      const mockConfig = { model_templates: { model1: "template1" } };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      getModelTemplatesConfig();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);

      invalidateModelTemplatesCache();

      getModelTemplatesConfig();
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    });

    it("should log cache invalidation", () => {
      const mockConfig = { model_templates: {} };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      getModelTemplatesConfig();
      invalidateModelTemplatesCache();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidated")
      );
    });
  });

  describe("updateModelTemplatesConfig", () => {
    it("should update cache and persist to disk", () => {
      const mockConfig = { model_templates: { model1: "template1" } };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      getModelTemplatesConfig();

      const updates = { model_templates: { model2: "template2" } };
      updateModelTemplatesConfig(updates);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      const [path, content] = (fs.writeFileSync as jest.Mock).mock
        .calls[0];
      expect(path).toContain("model-templates.json");
      expect(content).toContain("model2");
    });

    it("should merge updates with existing config", () => {
      const mockConfig = {
        model_templates: { model1: "template1" },
        other_field: "value",
      };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      getModelTemplatesConfig();

      const updates = { model_templates: { model2: "template2" } };
      updateModelTemplatesConfig(updates);

      const [, content] = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const written = JSON.parse(content);
      expect(written.model_templates).toEqual({
        model2: "template2",
      });
      expect(written.other_field).toBe("value");
    });

    it("should log update message", () => {
      const mockConfig = { model_templates: {} };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      getModelTemplatesConfig();
      updateModelTemplatesConfig({ model_templates: { new: "model" } });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Updated and persisted to disk")
      );
    });

    it("should handle write errors", () => {
      const mockConfig = { model_templates: {} };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("Write failed");
      });

      getModelTemplatesConfig();

      expect(() => {
        updateModelTemplatesConfig({ model_templates: {} });
      }).toThrow("Write failed");
    });

    it("should load config if cache not initialized", () => {
      const mockConfig = { model_templates: { model1: "template1" } };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      invalidateModelTemplatesCache();

      updateModelTemplatesConfig({ model_templates: { model2: "template2" } });

      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should format written JSON with proper indentation", () => {
      const mockConfig = { model_templates: { model1: "template1" } };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      getModelTemplatesConfig();
      updateModelTemplatesConfig({ model_templates: { model2: "template2" } });

      const [, content] = (fs.writeFileSync as jest.Mock).mock.calls[0];
      expect(content).toContain("\n");
    });
  });
});
