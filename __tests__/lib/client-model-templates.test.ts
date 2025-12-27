/**
 * Tests for client-side model templates functionality
 * File: src/lib/client-model-templates.ts
 */

import {
  loadModelTemplates,
  saveModelTemplate,
  getModelTemplate,
  getModelTemplates,
  getModelTemplatesSync,
  __resetCache__,
  saveTemplatesFile,
} from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe("client-model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    localStorageMock.clear();
    mockFetch.mockClear();
  });

  describe("loadModelTemplates", () => {
    it("should load templates from API and merge with defaults", async () => {
      const apiTemplates = {
        "custom-model": "custom-template",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: apiTemplates,
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b", "llama-2-7b");
      expect(result).toHaveProperty("custom-model", "custom-template");
      expect(mockFetch).toHaveBeenCalledWith("/api/model-templates");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return default templates when API fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b", "llama-2-7b");
      expect(result).toHaveProperty("mistral-7b", "mistral-7b");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return default templates when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Internal server error",
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(Object.keys(result)).toContain("llama2-7b");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should merge API templates with defaults (API takes precedence)", async () => {
      const apiTemplates = {
        "llama2-7b": "custom-llama-2-7b", // Override default
        "new-model": "new-template",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: apiTemplates,
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(result["llama2-7b"]).toBe("custom-llama-2-7b"); // API wins
      expect(result["new-model"]).toBe("new-template");
      expect(result).toHaveProperty("mistral-7b", "mistral-7b"); // Default preserved
    });

    it("should handle empty API response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should cache templates in localStorage on successful load", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "custom-model": "custom-template",
            },
          },
        }),
      });

      await loadModelTemplates();

      expect(localStorageMock.getItem('model-templates-cache')).toBeDefined();
      expect(localStorageMock.getItem('model-templates-timestamp')).toBeDefined();
    });

    it("should load from localStorage cache when API fails", async () => {
      const cachedTemplates = {
        "cached-model": "cached-template",
      };

      localStorageMock.setItem(
        'model-templates-cache',
        JSON.stringify(cachedTemplates)
      );

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("cached-model", "cached-template");
    });

    it("should handle invalid localStorage cache gracefully", async () => {
      localStorageMock.setItem('model-templates-cache', 'invalid json');

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadModelTemplates();

      // Should fall back to defaults
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should handle malformed JSON in API response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(Object.keys(result)).toContain("llama2-7b");
    });
  });

  describe("saveModelTemplate", () => {
    it("should save a single model template", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("new-model", "new-template");

      expect(mockFetch).toHaveBeenCalledWith("/api/model-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_templates: expect.objectContaining({
            "new-model": "new-template",
          }),
        }),
      });
    });

    it("should load templates if cache is empty before saving", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("test-model", "test-template");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should update existing template", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "existing-model": "old-template",
            },
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("existing-model", "new-template");

      const cached = getModelTemplatesSync();
      expect(cached["existing-model"]).toBe("new-template");
    });

    it("should delete template when null is passed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "test-model": "test-template",
            },
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("test-model", null);

      const cached = getModelTemplatesSync();
      expect(cached["test-model"]).toBeUndefined();
    });

    it("should throw error when save fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Save failed",
        }),
      });

      await expect(saveModelTemplate("test-model", "test-template")).rejects.toThrow("Save failed");
    });

    it("should handle network errors during save", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(saveModelTemplate("test-model", "test-template")).rejects.toThrow(
        "Network error"
      );
    });

    it("should save to localStorage cache after successful save", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("test-model", "test-template");

      expect(localStorageMock.getItem('model-templates-cache')).toBeDefined();
      expect(localStorageMock.getItem('model-templates-timestamp')).toBeDefined();
    });

    it("should preserve all templates when adding new one", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "model1": "template1",
              "model2": "template2",
            },
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("model3", "template3");

      const cached = getModelTemplatesSync();
      expect(cached).toHaveProperty("model1", "template1");
      expect(cached).toHaveProperty("model2", "template2");
      expect(cached).toHaveProperty("model3", "template3");
    });
  });

  describe("getModelTemplate", () => {
    it("should retrieve template from cache", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "test-model": "test-template",
            },
          },
        }),
      });

      await loadModelTemplates();

      const result = await getModelTemplate("test-model");

      expect(result).toBe("test-template");
    });

    it("should load templates if not initialized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "test-model": "test-template",
            },
          },
        }),
      });

      const result = await getModelTemplate("test-model");

      expect(result).toBe("test-template");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return undefined for non-existent model", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await getModelTemplate("non-existent-model");

      expect(result).toBeUndefined();
    });

    it("should load templates if cache is missing specific model", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "model1": "template1",
            },
          },
        }),
      });

      const result1 = await getModelTemplate("model1");
      expect(result1).toBe("template1");

      // Reset cache and load new model
      __resetCache__();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "model2": "template2",
            },
          },
        }),
      });

      const result2 = await getModelTemplate("model2");
      expect(result2).toBe("template2");
    });
  });

  describe("getModelTemplates", () => {
    it("should return all cached templates", async () => {
      const apiTemplates = { "custom-model": "custom-template" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: apiTemplates,
          },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("custom-model");
    });

    it("should return cached templates without API call if initialized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      await getModelTemplates();
      mockFetch.mockClear();

      const result = await getModelTemplates();

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it("should load templates if cache is empty", async () => {
      const apiTemplates = { "model1": "template1", "model2": "template2" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: apiTemplates,
          },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toEqual(
        expect.objectContaining({
          "model1": "template1",
          "model2": "template2",
        })
      );
    });

    it("should merge with default templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toHaveProperty("llama2-7b", "llama-2-7b");
      expect(result).toHaveProperty("mistral-7b", "mistral-7b");
    });
  });

  describe("getModelTemplatesSync", () => {
    it("should return cached templates synchronously", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "sync-model": "sync-template",
            },
          },
        }),
      });

      await loadModelTemplates();

      const result = getModelTemplatesSync();

      expect(result).toHaveProperty("sync-model", "sync-template");
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should load from localStorage if cache not initialized", () => {
      const cachedTemplates = {
        "cached-model": "cached-template",
      };

      localStorageMock.setItem(
        'model-templates-cache',
        JSON.stringify(cachedTemplates)
      );

      const result = getModelTemplatesSync();

      expect(result).toHaveProperty("cached-model", "cached-template");
    });

    it("should return empty object if nothing cached", () => {
      __resetCache__();
      localStorageMock.clear();

      const result = getModelTemplatesSync();

      expect(result).toEqual({});
    });

    it("should not trigger API calls", () => {
      const result = getModelTemplatesSync();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle invalid localStorage cache gracefully", () => {
      localStorageMock.setItem('model-templates-cache', 'invalid json');

      const result = getModelTemplatesSync();

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("__resetCache__", () => {
    it("should clear all cached templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "test": "value",
            },
          },
        }),
      });

      await loadModelTemplates();

      let cached = getModelTemplatesSync();
      expect(Object.keys(cached).length).toBeGreaterThan(0);

      __resetCache__();

      cached = getModelTemplatesSync();
      expect(cached).toEqual({});
    });

    it("should clear localStorage", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      await loadModelTemplates();

      __resetCache__();

      expect(localStorageMock.getItem('model-templates-cache')).toBeNull();
      expect(localStorageMock.getItem('model-templates-timestamp')).toBeNull();
    });

    it("should be callable multiple times without errors", () => {
      expect(() => {
        __resetCache__();
        __resetCache__();
        __resetCache__();
      }).not.toThrow();
    });
  });

  describe("saveTemplatesFile", () => {
    it("should save templates to API endpoint", async () => {
      const templates = { "model1": "template1", "model2": "template2" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith("/api/model-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_templates: templates }),
      });
    });

    it("should throw error when API returns failure", async () => {
      const templates = { "model1": "template1" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Save failed",
        }),
      });

      await expect(saveTemplatesFile(templates)).rejects.toThrow("Save failed");
    });

    it("should handle network errors", async () => {
      const templates = { "model1": "template1" };

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(saveTemplatesFile(templates)).rejects.toThrow("Network error");
    });

    it("should update cache after successful save", async () => {
      const templates = { "model1": "template1" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveTemplatesFile(templates);

      expect(localStorageMock.getItem('model-templates-cache')).toBeDefined();
    });

    it("should update timestamp after successful save", async () => {
      const templates = { "model1": "template1" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveTemplatesFile(templates);

      const timestamp = localStorageMock.getItem('model-templates-timestamp');
      expect(timestamp).toBeDefined();
      const tsNum = parseInt(timestamp || "0");
      expect(tsNum).toBeGreaterThan(0);
    });

    it("should handle empty templates object", async () => {
      const templates = {};

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();
    });

    it("should handle special characters in template values", async () => {
      const templates = {
        "model1": 'template with "quotes" and \'apostrophes\'',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();
    });

    it("should handle unicode characters", async () => {
      const templates = {
        "模型": "テンプレート",
        "model": "🎯 template",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("should handle full workflow: load, get, save, reload", async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const initial = await getModelTemplates();
      expect(initial).toHaveProperty("llama2-7b");

      // Get specific template
      const llamaTemplate = await getModelTemplate("llama2-7b");
      expect(llamaTemplate).toBe("llama-2-7b");

      // Save new template
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await saveModelTemplate("new-model", "new-template");

      // Reload should use cache
      const updated = await getModelTemplates();
      expect(updated).toHaveProperty("new-model", "new-template");
    });

    it("should handle localStorage persistence across function calls", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "persistent": "value",
            },
          },
        }),
      });

      await loadModelTemplates();

      const cache1 = localStorageMock.getItem('model-templates-cache');
      expect(cache1).toBeDefined();

      // Clear and reload from localStorage
      __resetCache__();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const templates = await loadModelTemplates();

      expect(templates).toHaveProperty("persistent", "value");
    });
  });

  describe("Edge Cases", () => {
    it("should handle model names with special characters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {
              "model with spaces": "template1",
              "model-with-dashes": "template2",
              "model_with_underscores": "template3",
            },
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("model with spaces");
      expect(result).toHaveProperty("model-with-dashes");
      expect(result).toHaveProperty("model_with_underscores");
    });

    it("should handle API returning null model_templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: null,
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should handle API returning undefined data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b");
    });
  });

  describe("Default Templates", () => {
    it("should have all required default templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("llama2-13b");
      expect(result).toHaveProperty("llama3-8b");
      expect(result).toHaveProperty("llama3-70b");
      expect(result).toHaveProperty("mistral-7b");
      expect(result).toHaveProperty("mistral-7b-instruct");
      expect(result).toHaveProperty("mistral-7b-uncensored");
    });

    it("should use correct default template values", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await loadModelTemplates();

      expect(result["llama2-7b"]).toBe("llama-2-7b");
      expect(result["llama2-13b"]).toBe("llama-2-13b");
      expect(result["llama3-8b"]).toBe("llama-3-8b");
      expect(result["llama3-70b"]).toBe("llama-3-70b");
      expect(result["mistral-7b"]).toBe("mistral-7b");
      expect(result["mistral-7b-instruct"]).toBe("mistral-7b-instruct");
      expect(result["mistral-7b-uncensored"]).toBe("mistral-7b-uncensored");
    });
  });
});
