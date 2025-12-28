import {
  loadModelTemplates,
  saveTemplatesFile,
  saveModelTemplate,
  getModelTemplate,
  getModelTemplates,
  getModelTemplatesSync,
  __resetCache__
} from "@/lib/client-model-templates";

describe("client-model-templates-optimized", () => {
  beforeEach(() => {
    // Reset cache before each test
    __resetCache__();
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("loadModelTemplates - Timeout (10s)", () => {
    it("should timeout after 10 seconds", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: { model_templates: { "test-model": "test-template" } }
                })
              }),
            15000
          )
        )
      );

      const loadPromise = loadModelTemplates();
      jest.advanceTimersByTime(10000); // Advance to timeout

      // Wait for promise to settle
      const result = await loadPromise;
      expect(result).toBeDefined();
      // Should fall back to defaults on timeout
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it("should not timeout when response is fast (< 10s)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "fast-model": "fast-template" } }
        })
      });

      const result = await loadModelTemplates();

      expect(result).toEqual({
        "fast-model": "fast-template",
        "llama2-7b": "llama-2-7b",
        "llama2-13b": "llama-2-13b",
        "llama3-8b": "llama-3-8b",
        "llama3-70b": "llama-3-70b",
        "mistral-7b": "mistral-7b",
        "mistral-7b-instruct": "mistral-7b-instruct",
        "mistral-7b-uncensored": "mistral-7b-uncensored"
      });
    });

    it("should log timeout error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true })
              }),
            15000
          )
        )
      );

      const loadPromise = loadModelTemplates();
      jest.advanceTimersByTime(10000);

      await loadPromise;

      expect(consoleSpy).toHaveBeenCalledWith(
        "loadModelTemplates timed out after 10 seconds"
      );
      consoleSpy.mockRestore();
    });
  });

  describe("loadModelTemplates - Request Deduplication", () => {
    it("should deduplicate concurrent requests", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "model1": "template1" } }
        })
      });

      // Make multiple concurrent requests
      const promise1 = loadModelTemplates();
      const promise2 = loadModelTemplates();
      const promise3 = loadModelTemplates();

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3
      ]);

      // All should return the same result
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);

      // Should only make one API call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should make new request after previous one completes", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { model_templates: { "model1": "template1" } }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { model_templates: { "model2": "template2" } }
          })
        });

      const result1 = await loadModelTemplates();
      const result2 = await loadModelTemplates();

      expect(result1).not.toEqual(result2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should return cached templates when already initialized", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "cached": "template" } }
        })
      });

      const result1 = await loadModelTemplates();
      const result2 = await loadModelTemplates();

      expect(result1).toEqual(result2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one request
    });
  });

  describe("loadModelTemplates - Non-blocking localStorage Writes", () => {
    it("should not block on localStorage writes", async () => {
      let storageWriteCount = 0;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = jest.fn((key: string, value: string) => {
        storageWriteCount++;
        // Simulate slow write
        return new Promise((resolve) =>
          setTimeout(() => {
            originalSetItem(key, value);
            resolve(undefined);
          }, 1000)
        );
      }) as any;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "model1": "template1" } }
        })
      });

      const startTime = Date.now();
      const result = await loadModelTemplates();
      const endTime = Date.now();

      // Result should return immediately, not wait for localStorage
      expect(endTime - startTime).toBeLessThan(500);
      expect(result).toBeDefined();

      localStorage.setItem = originalSetItem;
    });

    it("should write to localStorage asynchronously", (done) => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "model1": "template1" } }
        })
      });

      loadModelTemplates().then(() => {
        jest.advanceTimersByTime(1000);

        // Check if localStorage was called after request completes
        setTimeout(() => {
          expect(setItemSpy).toHaveBeenCalledWith(
            "model-templates-cache",
            expect.any(String)
          );
          setItemSpy.mockRestore();
          done();
        }, 100);
      });
    });

    it("should handle localStorage write errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "model1": "template1" } }
        })
      });

      const result = await loadModelTemplates();

      // Should still return templates even if localStorage fails
      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe("loadModelTemplates - Caching Strategies", () => {
    it("should cache templates after successful load", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "cached": "template" } }
        })
      });

      await loadModelTemplates();

      // Second call should use cache
      const result = await loadModelTemplates();
      expect(result).toHaveProperty("cached");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should fallback to localStorage cache on API failure", async () => {
      const mockCache = JSON.stringify({ "cached-model": "cached-template" });
      localStorage.setItem("model-templates-cache", mockCache);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await loadModelTemplates();

      expect(result).toEqual({ "cached-model": "cached-template" });
    });

    it("should handle corrupt localStorage cache", async () => {
      localStorage.setItem("model-templates-cache", "{invalid json}");

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await loadModelTemplates();

      // Should fall back to defaults
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should write timestamp to localStorage", (done) => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "model1": "template1" } }
        })
      });

      loadModelTemplates().then(() => {
        jest.advanceTimersByTime(1000);

        setTimeout(() => {
          expect(setItemSpy).toHaveBeenCalledWith(
            "model-templates-timestamp",
            expect.any(String)
          );
          setItemSpy.mockRestore();
          done();
        }, 100);
      });
    });

    it("should merge API templates with defaults", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "api-model": "api-template" } }
        })
      });

      const result = await loadModelTemplates();

      // Should include both defaults and API templates
      expect(result).toHaveProperty("api-model");
      expect(result).toHaveProperty("llama2-7b"); // Default
    });
  });

  describe("saveTemplatesFile", () => {
    it("should save templates via API", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const templates = { "save-model": "save-template" };
      await saveTemplatesFile(templates);

      expect(global.fetch).toHaveBeenCalledWith("/api/model-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_templates: templates })
      });
    });

    it("should throw on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: "Save failed" })
      });

      const templates = { "model": "template" };
      await expect(saveTemplatesFile(templates)).rejects.toThrow("Save failed");
    });

    it("should update cache after successful save", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const templates = { "model": "template" };
      await saveTemplatesFile(templates);

      const cachedTemplates = await getModelTemplates();
      expect(cachedTemplates).toEqual(templates);
    });
  });

  describe("saveModelTemplate", () => {
    it("should save single model template", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await saveModelTemplate("test-model", "test-template");

      expect(global.fetch).toHaveBeenCalledWith("/api/model-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("test-template")
      });
    });

    it("should delete template when null is passed", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await loadModelTemplates(); // Load initial

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await saveModelTemplate("test-model", null);

      const templates = await getModelTemplates();
      expect(templates["test-model"]).toBeUndefined();
    });

    it("should load templates if not initialized", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { model_templates: { "existing": "template" } }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      await saveModelTemplate("new-model", "new-template");

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getModelTemplate", () => {
    it("should return template for existing model", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: { "model1": "template1" } }
        })
      });

      const template = await getModelTemplate("model1");
      expect(template).toBe("template1");
    });

    it("should return undefined for non-existent model", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { model_templates: {} }
        })
      });

      const template = await getModelTemplate("non-existent");
      expect(template).toBeUndefined();
    });
  });

  describe("getModelTemplatesSync", () => {
    it("should return cached templates if available", () => {
      const mockCache = JSON.stringify({ "sync-model": "sync-template" });
      localStorage.setItem("model-templates-cache", mockCache);

      const templates = getModelTemplatesSync();
      expect(templates).toEqual({ "sync-model": "sync-template" });
    });

    it("should return empty object if no cache", () => {
      localStorage.removeItem("model-templates-cache");

      const templates = getModelTemplatesSync();
      expect(templates).toEqual({});
    });

    it("should handle cache parse errors", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      localStorage.setItem("model-templates-cache", "{invalid}");

      const templates = getModelTemplatesSync();
      expect(templates).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await loadModelTemplates();

      // Should fall back to defaults
      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle API response errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: "Server error" })
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle malformed API responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        }
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await loadModelTemplates();

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete template lifecycle", async () => {
      // Load templates
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { model_templates: { "model1": "template1" } }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      await loadModelTemplates();

      // Add new template
      await saveModelTemplate("model2", "template2");

      // Verify both exist
      const templates = await getModelTemplates();
      expect(templates).toHaveProperty("model1");
      expect(templates).toHaveProperty("model2");
    });

    it("should handle rapid template updates", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { model_templates: {} }
          })
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true })
        });

      await loadModelTemplates();

      // Rapid updates
      const updates = Array.from({ length: 10 }, (_, i) =>
        saveModelTemplate(`model${i}`, `template${i}`)
      );

      await Promise.all(updates);

      const templates = await getModelTemplates();
      expect(Object.keys(templates).length).toBeGreaterThanOrEqual(10);
    });
  });
});
