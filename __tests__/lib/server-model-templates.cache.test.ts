/**
 * Tests for cache management (getModelTemplatesSync, __resetCache__)
 * File: src/lib/client-model-templates.ts
 */

import {
  getModelTemplatesSync,
  loadModelTemplates,
  getModelTemplates,
  __resetCache__,
} from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Cache Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    mockFetch.mockClear();
  });

  describe("getModelTemplatesSync", () => {
    it("should return cached templates synchronously", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "sync-model": "sync-template" } },
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

    it("should return same cached data on subsequent calls", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "initial": "value" } },
        }),
      });

      await loadModelTemplates();

      const result1 = getModelTemplatesSync();
      expect(result1["initial"]).toBe("value");

      // Subsequent calls should return same cached data
      const result2 = getModelTemplatesSync();
      expect(result2["initial"]).toBe("value");
      expect(result2).toBe(result1);
    });
  });

  describe("__resetCache__", () => {
    it("should clear all cached templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "test": "value" } },
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
          data: { model_templates: {} },
        }),
      });

      await loadModelTemplates();

      __resetCache__();

      // Next call should reload from API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "reloaded": "value" } },
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
});
