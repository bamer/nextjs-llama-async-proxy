/**
 * Tests for integration workflows and edge cases
 * File: src/lib/client-model-templates.ts
 */

import {
  loadModelTemplates,
  getModelTemplate,
  getModelTemplates,
  saveModelTemplate,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.integration", () => {
  beforeEach(beforeEachSetup);

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
});
