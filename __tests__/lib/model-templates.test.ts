import {
  loadModelTemplates,
  saveModelTemplate,
  getModelTemplate,
  getModelTemplates,
  saveTemplatesFile,
  __resetCache__,
} from "@/lib/client-model-templates";

describe("model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("loadModelTemplates", () => {
    it("should load templates from API successfully", async () => {
      const mockTemplates = {
        "custom-model": "custom-template",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: mockTemplates,
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await loadModelTemplates();

      expect(result).toEqual(
        expect.objectContaining({
          "llama2-7b": "llama-2-7b",
          "llama2-13b": "llama-2-13b",
          "llama3-8b": "llama-3-8b",
          "llama3-70b": "llama-3-70b",
          "mistral-7b": "mistral-7b",
          "mistral-7b-instruct": "mistral-7b-instruct",
          "mistral-7b-uncensored": "mistral-7b-uncensored",
          "custom-model": "custom-template",
        })
      );
      expect(fetch).toHaveBeenCalledWith("/api/model-templates");
    });

    it("should merge API templates with default templates", async () => {
      const mockTemplates = {
        "llama2-7b": "custom-llama-2-7b",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: mockTemplates,
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await loadModelTemplates();

      expect(result["llama2-7b"]).toBe("custom-llama-2-7b");
      expect(result["llama3-8b"]).toBe("llama-3-8b");
    });

    it("should return default templates when API returns success but empty templates", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("llama3-8b");
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it("should return default templates when API call fails", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("llama3-8b");
    });

    it("should return default templates when API returns success: false", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Failed to load templates",
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("llama3-8b");
    });

    it("should handle API response with missing model_templates field", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await loadModelTemplates();

      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("llama3-8b");
    });
  });

  describe("saveTemplatesFile", () => {
    it("should save templates via POST request", async () => {
      const templates = {
        "test-model": "test-template",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: templates,
            timestamp: new Date().toISOString(),
          }),
      });

      await expect(saveTemplatesFile(templates)).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith("/api/model-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_templates: templates }),
      });
    });

    it("should throw error when API returns success: false", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Failed to save templates",
            timestamp: new Date().toISOString(),
          }),
      });

      await expect(saveTemplatesFile({})).rejects.toThrow(
        "Failed to save templates"
      );
    });

    it("should throw error when API call fails", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      await expect(saveTemplatesFile({})).rejects.toThrow("Network error");
    });

    it("should handle custom error messages from API", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Custom validation error",
            timestamp: new Date().toISOString(),
          }),
      });

      await expect(saveTemplatesFile({})).rejects.toThrow(
        "Custom validation error"
      );
    });
  });

  describe("saveModelTemplate", () => {
    it("should save a single model template", async () => {
      const existingTemplates = {
        "existing-model": "existing-template",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: existingTemplates,
            timestamp: new Date().toISOString(),
          }),
      });

      await saveModelTemplate("new-model", "new-template");

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith("/api/model-templates");
      
      // Get the actual POST call
      const postCall = (fetch as jest.Mock).mock.calls.find(
        (call: any) => call[1]?.method === "POST"
      );
      expect(postCall).toBeDefined();
      
      // Verify the POST call includes expected templates
      const postBody = JSON.parse(postCall[1].body);
      expect(postBody.model_templates["existing-model"]).toBe("existing-template");
      expect(postBody.model_templates["new-model"]).toBe("new-template");
    });

    it("should load existing templates before saving new one", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {
                "existing-model": "existing-template",
              },
              timestamp: new Date().toISOString(),
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {
                "existing-model": "existing-template",
                "new-model": "new-template",
              },
              timestamp: new Date().toISOString(),
            }),
        });

      await saveModelTemplate("new-model", "new-template");

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("should update existing template", async () => {
      const existingTemplates = {
        "existing-model": "old-template",
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: existingTemplates,
              timestamp: new Date().toISOString(),
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {
                "existing-model": "new-template",
              },
              timestamp: new Date().toISOString(),
            }),
        });

      await saveModelTemplate("existing-model", "new-template");

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getModelTemplate", () => {
    it("should return cached template if available", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const result1 = await getModelTemplate("llama2-7b");
      const result2 = await getModelTemplate("llama2-7b");

      expect(result1).toBe("llama-2-7b");
      expect(result2).toBe("llama-2-7b");
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should load templates from API if not in cache", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {
              "custom-model": "custom-template",
            },
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await getModelTemplate("custom-model");

      expect(result).toBe("custom-template");
      expect(fetch).toHaveBeenCalledWith("/api/model-templates");
    });

    it("should return undefined for non-existent model", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await getModelTemplate("non-existent-model");

      expect(result).toBeUndefined();
    });

    it("should return default template when cached", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await getModelTemplate("llama3-8b");

      expect(result).toBe("llama-3-8b");
    });
  });

  describe("getModelTemplates", () => {
    it("should return all cached templates", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {
              "custom-model": "custom-template",
            },
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await getModelTemplates();

      expect(result).toHaveProperty("llama2-7b");
      expect(result).toHaveProperty("llama3-8b");
      expect(result).toHaveProperty("custom-model");
    });

    it("should load templates from API if cache is empty", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {
              "custom-model": "custom-template",
            },
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await getModelTemplates();

      expect(fetch).toHaveBeenCalledWith("/api/model-templates");
      expect(result).toHaveProperty("custom-model");
    });

    it("should return cached templates without API call if cache is populated", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {
              "custom-model": "custom-template",
            },
            timestamp: new Date().toISOString(),
          }),
      });

      await getModelTemplates();
      const result2 = await getModelTemplates();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should return object with expected structure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const result = await getModelTemplates();

      expect(typeof result).toBe("object");
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe("default templates", () => {
    it("should include all expected default templates", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const templates = await getModelTemplates();

      expect(templates).toHaveProperty("llama2-7b", "llama-2-7b");
      expect(templates).toHaveProperty("llama2-13b", "llama-2-13b");
      expect(templates).toHaveProperty("llama3-8b", "llama-3-8b");
      expect(templates).toHaveProperty("llama3-70b", "llama-3-70b");
      expect(templates).toHaveProperty("mistral-7b", "mistral-7b");
      expect(templates).toHaveProperty("mistral-7b-instruct", "mistral-7b-instruct");
      expect(templates).toHaveProperty("mistral-7b-uncensored", "mistral-7b-uncensored");
    });

    it("should have correct default template values", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            model_templates: {},
            timestamp: new Date().toISOString(),
          }),
      });

      const templates = await getModelTemplates();

      expect(templates["llama2-7b"]).toBe("llama-2-7b");
      expect(templates["llama3-8b"]).toBe("llama-3-8b");
    });
  });

  describe("integration scenarios", () => {
    it("should handle save and load cycle", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {},
              timestamp: new Date().toISOString(),
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {
                "new-model": "new-template",
              },
              timestamp: new Date().toISOString(),
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {
                "new-model": "new-template",
              },
              timestamp: new Date().toISOString(),
            }),
        });

      await saveModelTemplate("new-model", "new-template");
      const templates = await getModelTemplates();

      expect(templates["new-model"]).toBe("new-template");
    });

    it("should maintain cache integrity across multiple operations", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              model_templates: {},
              timestamp: new Date().toISOString(),
            }),
        });

      const t1 = await getModelTemplates();
      const t2 = await getModelTemplates();
      const t3 = await getModelTemplates();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(t1).toEqual(t2);
      expect(t2).toEqual(t3);
    });
  });
});
