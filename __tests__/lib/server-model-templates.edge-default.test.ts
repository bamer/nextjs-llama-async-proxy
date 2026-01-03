/**
 * Edge cases and default templates tests
 * File: src/lib/client-model-templates.ts
 */

import { getModelTemplates, __resetCache__ } from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Edge Cases & Defaults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    mockFetch.mockClear();
  });

  describe("Edge Cases", () => {
    it("should handle template names with special characters", async () => {
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
          data: {
            model_templates: {
              "empty-template": "",
              "null-template": null as unknown as Record<string, string>,
            },
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
          data: { model_templates: null as unknown as Record<string, string> },
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
          data: { model_templates: { [longName]: longValue } },
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
          data: { model_templates: {} },
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
          data: { model_templates: {} },
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
