/**
 * Tests for saving single model templates - basic operations
 * File: src/lib/client-model-templates.ts
 */

import {
  saveModelTemplate,
  getModelTemplatesSync,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.saving-single-basic", () => {
  beforeEach(beforeEachSetup);

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

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const saveCall = mockFetch.mock.calls[1];
      expect(saveCall[0]).toBe("/api/model-templates");
      expect(saveCall[1]).toEqual(
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      const body = JSON.parse(saveCall[1].body as string);
      expect(body.model_templates).toEqual(
        expect.objectContaining({
          "new-model": "new-template",
        })
      );
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
  });
});
