/**
 * Tests for retrieving templates, integration, and edge cases
 * File: src/lib/client-model-templates.ts
 */

import {
  loadModelTemplates,
  getModelTemplate,
  __resetCache__,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.retrieval", () => {
  beforeEach(beforeEachSetup);

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
});
