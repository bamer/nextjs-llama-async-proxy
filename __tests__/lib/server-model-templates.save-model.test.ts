/**
 * Tests for saving model templates (saveModelTemplate)
 * File: src/lib/client-model-templates.ts
 */

import {
  saveModelTemplate,
  getModelTemplatesSync,
  __resetCache__,
} from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Save Model Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCache__();
    mockFetch.mockClear();
  });

  it("should save a single model template", async () => {
    const mockTemplates = { "llama2-7b": "llama-2-7b" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: mockTemplates },
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { ...mockTemplates, "new-model": "new-template" } },
      }),
    });

    await saveModelTemplate("new-model", "new-template");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/model-templates",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("new-model"),
        body: expect.stringContaining("new-template"),
      })
    );
  });

  it("should load templates if cache is empty before saving", async () => {
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
        data: { model_templates: { "test-model": "test-template" } },
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
        data: { model_templates: { "existing-model": "old-template" } },
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: { "existing-model": "new-template" } },
      }),
    });

    await saveModelTemplate("existing-model", "new-template");

    const cached = getModelTemplatesSync();
    expect(cached["existing-model"]).toBe("new-template");
  });

  it("should throw error when save fails", async () => {
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
        success: false,
        error: "Save failed",
      }),
    });

    await expect(saveModelTemplate("test-model", "test-template")).rejects.toThrow();
  });

  it("should handle network errors during save", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { model_templates: {} },
      }),
    });

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(saveModelTemplate("test-model", "test-template")).rejects.toThrow(
      "Network error"
    );
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
        data: {
          model_templates: {
            "model1": "template1",
            "model2": "template2",
            "model3": "template3",
          },
        },
      }),
    });

    await saveModelTemplate("model3", "template3");

    const cached = getModelTemplatesSync();
    expect(cached).toHaveProperty("model1", "template1");
    expect(cached).toHaveProperty("model2", "template2");
    expect(cached).toHaveProperty("model3", "template3");
  });
});
