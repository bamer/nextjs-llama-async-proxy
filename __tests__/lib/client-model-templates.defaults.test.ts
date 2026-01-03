/**
 * Tests for default templates
 * File: src/lib/client-model-templates.ts
 */

import {
  loadModelTemplates,
} from "@/lib/client-model-templates";
import { beforeEachSetup, mockFetch } from "./client-model-templates.helpers";

describe("client-model-templates.defaults", () => {
  beforeEach(beforeEachSetup);

  describe("Default Templates", () => {
    it("should have all required default templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await loadModelTemplates();

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
          data: {
            model_templates: {},
          },
        }),
      });

      const result = await loadModelTemplates();

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
