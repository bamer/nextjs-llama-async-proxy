/**
 * Tests for loading model templates functionality
 * File: src/lib/client-model-templates.ts
 */

import {
  loadModelTemplates,
  getModelTemplates,
  __resetCache__,
} from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Load Tests", () => {
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
          data: { model_templates: apiTemplates },
        }),
      });

      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("llama2-7b", "llama-2-7b");
      expect(result).toHaveProperty("custom-model", "custom-template");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/model-templates",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
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
          data: { model_templates: apiTemplates },
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
          data: { model_templates: {} },
        }),
      });

      const result = await loadModelTemplates();

      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result).toHaveProperty("llama2-7b");
    });
  });

  describe("getModelTemplates", () => {
    it("should return all cached templates", async () => {
      const apiTemplates = { "custom-model": "custom-template" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: apiTemplates },
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
          data: { model_templates: {} },
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
          data: { model_templates: apiTemplates },
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
          data: { model_templates: {} },
        }),
      });

      const result = await getModelTemplates();

      expect(result).toHaveProperty("llama2-7b", "llama-2-7b");
      expect(result).toHaveProperty("mistral-7b", "mistral-7b");
    });
  });
});
