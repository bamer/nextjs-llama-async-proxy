/**
 * Tests for saving templates file (saveTemplatesFile)
 * File: src/lib/client-model-templates.ts
 */

import { saveTemplatesFile } from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("client/model-templates - Save File Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

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

  it("should handle empty templates object", async () => {
    const templates = {};

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
      body: JSON.stringify({ model_templates: {} }),
    });
  });

  it("should handle special characters in template values", async () => {
    const templates = { "model1": 'template with "quotes" and \'apostrophes\'' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    await expect(saveTemplatesFile(templates)).resolves.not.toThrow();

    expect(mockFetch).toHaveBeenCalled();
  });

  it("should handle unicode characters", async () => {
    const templates = { "模型": "模板", "model": "テンプレート" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    await expect(saveTemplatesFile(templates)).resolves.not.toThrow();
  });

  it("should handle large number of templates", async () => {
    const templates = Array.from({ length: 100 }, (_, i) => ({
      [`model${i}`]: `template${i}`,
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    await expect(saveTemplatesFile(templates)).resolves.not.toThrow();
  });
});
