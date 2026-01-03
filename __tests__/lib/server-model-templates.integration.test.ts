/**
 * Integration tests for model templates
 * File: src/lib/client-model-templates.ts
 */

import {
  getModelTemplates,
  getModelTemplate,
  saveModelTemplate,
  getModelTemplatesSync,
  __resetCache__,
} from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    mockFetch.mockClear();
  });

  it("should handle full workflow: load, get, save, reload", async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: {} },
      }),
    });

    const initial = await getModelTemplates();
    expect(initial).toHaveProperty("llama2-7b");

    // Get specific template
    const llamaTemplate = await getModelTemplate("llama2-7b");
    expect(llamaTemplate).toBe("llama-2-7b");

    // Save new template
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { ...initial, "new-model": "new-template" } },
      }),
    });

    await saveModelTemplate("new-model", "new-template");

    // Reload
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { ...initial, "new-model": "new-template" } },
      }),
    });

    const updated = await getModelTemplates();
    expect(updated).toHaveProperty("new-model", "new-template");
  });

  it("should handle multiple concurrent operations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: {} },
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { "model1": "template1" } },
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { "model2": "template2" } },
      }),
    });

    await Promise.all([
      getModelTemplates(),
      saveModelTemplate("model1", "template1"),
      saveModelTemplate("model2", "template2"),
    ]);

    const cached = getModelTemplatesSync();
    expect(cached).toHaveProperty("model1", "template1");
    expect(cached).toHaveProperty("model2", "template2");
  });
});
