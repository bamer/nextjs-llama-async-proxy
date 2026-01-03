/**
 * Tests for sync and cache operations
 * File: src/lib/client-model-templates.ts
 */

import {
  loadModelTemplates,
  getModelTemplatesSync,
  __resetCache__,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.sync-cache", () => {
  beforeEach(beforeEachSetup);

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

    it("should return empty object if nothing cached", () => {
      __resetCache__();

      const result = getModelTemplatesSync();

      expect(result).toEqual({});
    });

    it("should not trigger API calls", () => {
      const result = getModelTemplatesSync();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toBeDefined();
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

    it("should be callable multiple times without errors", () => {
      expect(() => {
        __resetCache__();
        __resetCache__();
        __resetCache__();
      }).not.toThrow();
    });
  });
});
