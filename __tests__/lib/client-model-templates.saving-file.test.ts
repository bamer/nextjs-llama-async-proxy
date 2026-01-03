/**
 * Tests for saving templates file
 * File: src/lib/client-model-templates.ts
 */

import {
  saveTemplatesFile,
  getModelTemplatesSync,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.saving-file", () => {
  beforeEach(beforeEachSetup);

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

      const cached = getModelTemplatesSync();
      expect(cached).toHaveProperty("model1", "template1");
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
});
