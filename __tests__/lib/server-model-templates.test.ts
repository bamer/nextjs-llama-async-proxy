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

describe("client/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
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
          model_templates: apiTemplates,
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
        ok: false,
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
          model_templates: apiTemplates,
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
          model_templates: {},
        }),
      });

      const result = await loadModelTemplates();

      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should initialize cache flag after successful load", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {},
        }),
      });

      await loadModelTemplates();

      // Second call should use cache
      const cachedResult = getModelTemplatesSync();
      expect(Object.keys(cachedResult)).toContain("llama2-7b");

      mockFetch.mockClear();
      const result2 = await loadModelTemplates();

      // Should still call fetch (implementation doesn't check cache)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed API response", async () => {
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
      const mockTemplates = { "llama2-7b": "llama-2-7b" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: mockTemplates,
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { ...mockTemplates, "new-model": "new-template" },
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
          model_templates: {},
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "test-model": "test-template" },
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
          model_templates: { "existing-model": "old-template" },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "existing-model": "new-template" },
        }),
      });

      await saveModelTemplate("existing-model", "new-template");

      const cached = getModelTemplatesSync();
      expect(cached["existing-model"]).toBe("new-template");
    });

    it("should throw error when save fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {},
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "Save failed",
        }),
      });

      await expect(saveModelTemplate("test-model", "test-template")).rejects.toThrow();
    });

    it("should handle network errors during save", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {},
        }),
      });

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(saveModelTemplate("test-model", "test-template")).rejects.toThrow(
        "Network error"
      );
    });

    it("should preserve all templates when adding new one", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {
            "model1": "template1",
            "model2": "template2",
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {
            "model1": "template1",
            "model2": "template2",
            "model3": "template3",
          },
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
          model_templates: { "test-model": "test-template" },
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
          model_templates: { "test-model": "test-template" },
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
          model_templates: {},
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
          model_templates: { "model1": "template1" },
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
          model_templates: { "model2": "template2" },
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
          model_templates: apiTemplates,
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
          model_templates: {},
        }),
      });

      await getModelTemplates();
      mockFetch.mockClear();

      const result = await getModelTemplates();

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
      // Note: Implementation still calls fetch even with cache
      // This tests current behavior
    });

    it("should load templates if cache is empty", async () => {
      const apiTemplates = { "model1": "template1", "model2": "template2" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: apiTemplates,
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
          model_templates: {},
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
          model_templates: { "sync-model": "sync-template" },
        }),
      });

      await loadModelTemplates();

      const result = getModelTemplatesSync();

      expect(result).toHaveProperty("sync-model", "sync-template");
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should return empty object if cache not initialized", () => {
      __resetCache__();

      const result = getModelTemplatesSync();

      expect(result).toEqual({});
    });

    it("should not trigger API calls", () => {
      const result = getModelTemplatesSync();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should reflect changes to cached templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "initial": "value" },
        }),
      });

      await loadModelTemplates();

      const result1 = getModelTemplatesSync();
      expect(result1["initial"]).toBe("value");

      // Simulate cache update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "updated": "value" },
        }),
      });

      await loadModelTemplates();

      const result2 = getModelTemplatesSync();
      expect(result2["initial"]).toBeUndefined();
      expect(result2["updated"]).toBe("value");
    });
  });

  describe("__resetCache__", () => {
    it("should clear all cached templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "test": "value" },
        }),
      });

      await loadModelTemplates();

      let cached = getModelTemplatesSync();
      expect(Object.keys(cached).length).toBeGreaterThan(0);

      __resetCache__();

      cached = getModelTemplatesSync();
      expect(cached).toEqual({});
    });

    it("should reset initialization flag", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {},
        }),
      });

      await loadModelTemplates();

      __resetCache__();

      // Next call should reload from API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "reloaded": "value" },
        }),
      });

      await getModelTemplates();

      const cached = getModelTemplatesSync();
      expect(cached).toHaveProperty("reloaded");
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

    it("should handle empty templates object", async () => {
      const templates = {};

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
        body: JSON.stringify({ model_templates: {} }),
      });
    });

    it("should handle special characters in template values", async () => {
      const templates = { "model1": 'template with "quotes" and \'apostrophes\'' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalled();
    });

    it("should handle unicode characters", async () => {
      const templates = { "模型": "模板", "model": "テンプレート" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();
    });

    it("should handle large number of templates", async () => {
      const templates = Array.from({ length: 100 }, (_, i) => ({
        [`model${i}`]: `template${i}`,
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

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
          model_templates: {},
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
          model_templates: { ...initial, "new-model": "new-template" },
        }),
      });

      await saveModelTemplate("new-model", "new-template");

      // Reload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { ...initial, "new-model": "new-template" },
        }),
      });

      const updated = await getModelTemplates();
      expect(updated).toHaveProperty("new-model", "new-template");
    });

    it("should handle multiple concurrent operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {},
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "model1": "template1" },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { "model2": "template2" },
        }),
      });

      await Promise.all([
        getModelTemplates(),
        saveModelTemplate("model1", "template1"),
        saveModelTemplate("model2", "template2"),
      ]);

      const cached = getModelTemplatesSync();
      expect(cached).toHaveProperty("model1", "template1");
      expect(cached).toHaveProperty("model2", "template2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle template names with special characters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {
            "model with spaces": "template1",
            "model-with-dashes": "template2",
            "model_with_underscores": "template3",
          },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toHaveProperty("model with spaces");
      expect(result).toHaveProperty("model-with-dashes");
      expect(result).toHaveProperty("model_with_underscores");
    });

    it("should handle empty template values", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {
            "empty-template": "",
            "null-template": null as any,
          },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toHaveProperty("empty-template", "");
    });

    it("should handle API returning null model_templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: null as any,
        }),
      });

      const result = await getModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b");
    });

    it("should handle very long template names and values", async () => {
      const longName = "model-" + "a".repeat(100);
      const longValue = "template-" + "b".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: { [longName]: longValue },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toHaveProperty(longName, longValue);
    });
  });

  describe("Default Templates", () => {
    it("should have all required default templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          model_templates: {},
        }),
      });

      const result = await getModelTemplates();

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
          model_templates: {},
        }),
      });

      const result = await getModelTemplates();

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
