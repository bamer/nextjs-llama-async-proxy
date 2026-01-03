/**
 * Tests for saving single model templates - advanced operations
 * File: src/lib/client-model-templates.ts
 */

import {
  saveModelTemplate,
  getModelTemplatesSync,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.saving-single-advanced", () => {
  beforeEach(beforeEachSetup);

  describe("saveModelTemplate", () => {
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

    it("should update cache after successful save", async () => {
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

      const cached = getModelTemplatesSync();
      expect(cached).toHaveProperty("test-model", "test-template");
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
});
