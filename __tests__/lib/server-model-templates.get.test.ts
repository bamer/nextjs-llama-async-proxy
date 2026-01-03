/**
 * Tests for getting model templates
 * File: src/lib/client-model-templates.ts
 */

import { getModelTemplate, loadModelTemplates, __resetCache__ } from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Get Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    mockFetch.mockClear();
  });

  it("should retrieve template from cache", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { "test-model": "test-template" } },
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
        data: { model_templates: { "test-model": "test-template" } },
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
        data: { model_templates: {} },
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
        data: { model_templates: { "model1": "template1" } },
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
        data: { model_templates: { "model2": "template2" } },
      }),
    });

    const result2 = await getModelTemplate("model2");
    expect(result2).toBe("template2");
  });
});
