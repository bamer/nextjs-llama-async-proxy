import {
  loadModelTemplates,
  saveTemplatesFile,
  saveModelTemplate,
  getModelTemplate,
  getModelTemplates,
  getModelTemplatesSync,
  __resetCache__,
} from "@/lib/client-model-templates";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console
const mockConsole = {
  error: jest.fn(),
};
global.console = mockConsole as any;

const DEFAULT_TEMPLATES = [
  { name: "llama2-7b", template: "llama-2-7b" },
  { name: "llama2-13b", template: "llama-2-13b" },
  { name: "llama3-8b", template: "llama-3-8b" },
  { name: "llama3-70b", template: "llama-3-70b" },
  { name: "mistral-7b", template: "mistral-7b" },
  { name: "mistral-7b-instruct", template: "mistral-7b-instruct" },
  { name: "mistral-7b-uncensored", template: "mistral-7b-uncensored" },
];

describe("client-model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("loadModelTemplates", () => {
    it("should return cached templates if already loaded", async () => {
      // Mock successful API response
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "template" } },
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const expectedResult = {
        ...DEFAULT_TEMPLATES.reduce((acc, t) => ({ ...acc, [t.name]: t.template }), {}),
        test: "template"
      };

      // First call loads and caches
      const result1 = await loadModelTemplates();
      expect(result1).toEqual(expectedResult);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should return cached result
      const result2 = await loadModelTemplates();
      expect(result2).toEqual(expectedResult);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not call fetch again
    });

    it("should load templates from API successfully", async () => {
      const apiResponse = {
        success: true,
        data: {
          model_templates: {
            custom1: "template1",
            custom2: "template2",
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const result = await loadModelTemplates();

      const expected = {
        ...DEFAULT_TEMPLATES.reduce((acc: Record<string, string>, t) => ({ ...acc, [t.name]: t.template }), {}),
        custom1: "template1",
        custom2: "template2",
      };

      expect(result).toEqual(expected);
      expect(mockFetch).toHaveBeenCalledWith("/api/model-templates", {
        signal: expect.any(AbortSignal),
      });
    });

    it("should handle API failure and return defaults", async () => {
      const apiResponse = {
        success: false,
        error: "API error",
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const result = await loadModelTemplates();

      const expected = DEFAULT_TEMPLATES.reduce((acc: Record<string, string>, t) => ({ ...acc, [t.name]: t.template }), {});
      expect(result).toEqual(expected);
      expect(mockConsole.error).toHaveBeenCalledWith("Failed to load templates:", "API error");
    });

    it("should handle fetch error and return defaults", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadModelTemplates();

      const expected = DEFAULT_TEMPLATES.reduce((acc: Record<string, string>, t) => ({ ...acc, [t.name]: t.template }), {});
      expect(result).toEqual(expected);
      expect(mockConsole.error).toHaveBeenCalledWith("Failed to load templates from API:", expect.any(Error));
    });

    it("should handle timeout", async () => {
      // Simplified timeout test - just verify error handling
      const mockController = {
        signal: {},
        abort: jest.fn(),
      };
      const abortControllerSpy = jest.spyOn(global, 'AbortController').mockImplementation(() => mockController as any);

      // Mock fetch to reject with AbortError
      const abortError = new Error("Request aborted");
      (abortError as any).name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await loadModelTemplates();

      const expected = DEFAULT_TEMPLATES.reduce((acc: Record<string, string>, t) => ({ ...acc, [t.name]: t.template }), {});
      expect(result).toEqual(expected);
      expect(mockConsole.error).toHaveBeenCalledWith("loadModelTemplates timed out after 30 seconds");

      abortControllerSpy.mockRestore();
    }, 10000);

    it("should deduplicate concurrent requests", async () => {
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "template" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      // Start two concurrent requests
      const promise1 = loadModelTemplates();
      const promise2 = loadModelTemplates();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch call
    }, 10000);
  });

  describe("saveTemplatesFile", () => {
    it("should save templates successfully", async () => {
      const templates = { model1: "temp1", model2: "temp2" };
      const apiResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      await saveTemplatesFile(templates);

      expect(mockFetch).toHaveBeenCalledWith("/api/model-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_templates: templates }),
      });

      // Cache should be updated
      expect(getModelTemplatesSync()).toEqual(templates);
    });

    it("should throw error on API failure", async () => {
      const templates = { test: "template" };
      const apiResponse = { success: false, error: "Save failed" };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      await expect(saveTemplatesFile(templates)).rejects.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith("Failed to save templates:", expect.any(Error));
    });

    it("should throw error on network failure", async () => {
      const templates = { test: "template" };

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(saveTemplatesFile(templates)).rejects.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith("Failed to save templates:", expect.any(Error));
    });
  });

  describe("saveModelTemplate", () => {
    it("should save new template", async () => {
      // First mock will load default templates
      const loadResponse = {
        success: true,
        data: { model_templates: {} },
      };
      const saveResponse = { success: true };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(loadResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(saveResponse),
        });

      await saveModelTemplate("newModel", "newTemplate");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1];
      expect(secondCall).toEqual([
        "/api/model-templates",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      // Check that body contains newModel
      const body = JSON.parse(secondCall[1].body);
      expect(body.model_templates).toHaveProperty("newModel", "newTemplate");
    }, 10000);

    it("should delete template when null", async () => {
      // First load with some templates
      const loadResponse = {
        success: true,
        data: { model_templates: { model1: "template1" } },
      };
      const saveResponse = { success: true };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(loadResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(saveResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(saveResponse),
        });

      await saveModelTemplate("model1", "template1");

      // Now delete - since cache is already loaded, it won't fetch again
      await saveModelTemplate("model1", null);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      const thirdCall = mockFetch.mock.calls[2];
      expect(thirdCall).toEqual([
        "/api/model-templates",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      // Check that model1 was deleted
      const body = JSON.parse(thirdCall[1].body);
      expect(body.model_templates).not.toHaveProperty("model1");
      // Should still have default templates
      expect(body.model_templates).toHaveProperty("llama2-7b");
    }, 10000);

    it("should load templates if not cached", async () => {
      const loadResponse = {
        success: true,
        data: { model_templates: { existing: "template" } },
      };

      const saveResponse = { success: true };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(loadResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(saveResponse),
        });

      await saveModelTemplate("newModel", "newTemplate");

      expect(mockFetch).toHaveBeenCalledTimes(2); // Load and save
    }, 10000);
  });

  describe("getModelTemplate", () => {
    it("should return cached template", async () => {
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "cached" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const result = await getModelTemplate("test");

      expect(result).toBe("cached");
    }, 10000);

    it("should load templates if not cached", async () => {
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "loaded" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const result = await getModelTemplate("test");

      expect(result).toBe("loaded");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  describe("getModelTemplates", () => {
    it("should return cached templates", async () => {
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "template" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const result = await getModelTemplates();

      expect(result).toEqual({
        ...DEFAULT_TEMPLATES.reduce((acc: Record<string, string>, t) => ({ ...acc, [t.name]: t.template }), {}),
        test: "template",
      });
    }, 10000);

    it("should load templates if not initialized", async () => {
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "template" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      const result = await getModelTemplates();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("test", "template");
      // Verify defaults are included
      DEFAULT_TEMPLATES.forEach(({ name, template }) => {
        expect(result).toHaveProperty(name, template);
      });
    }, 10000);
  });

  describe("getModelTemplatesSync", () => {
    it("should return current cache", async () => {
      // First load some templates into cache
      const apiResponse = {
        success: true,
        data: { model_templates: { sync: "template" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      // Load templates to populate cache
      await loadModelTemplates();

      // Now test sync function
      const result = getModelTemplatesSync();

      expect(result).toHaveProperty("sync", "template");
      // Should also have defaults
      DEFAULT_TEMPLATES.forEach(({ name, template }) => {
        expect(result).toHaveProperty(name, template);
      });
    });
  });

  describe("__resetCache__", () => {
    it("should reset cache for testing", async () => {
      // First load some templates
      const apiResponse = {
        success: true,
        data: { model_templates: { test: "template" } },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(apiResponse),
      });

      await loadModelTemplates();

      // Verify cache is populated
      expect(getModelTemplatesSync()).toHaveProperty("test");

      // Now reset
      __resetCache__();

      // Verify cache is empty
      expect(getModelTemplatesSync()).toEqual({});
    });
  });
});