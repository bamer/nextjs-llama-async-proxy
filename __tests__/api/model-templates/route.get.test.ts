/**
 * Tests for GET /api/model-templates
 * File: app/api/model-templates/route.ts
 */

import { GET } from "../../../app/api/model-templates/route";
import { promises as fs } from "fs";
import { validateConfig } from "./route.shared-mocks";

const { readFile } = fs as jest.Mocked<typeof fs>;

describe("GET /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    try {
      require('@/lib/model-templates-config').invalidateModelTemplatesCache();
    } catch (e) {
      // Ignore if module not loaded
    }
  });

  it("should return model templates successfully", async () => {
    const mockTemplates = {
      model_templates: {
        "llama2-7b": "llama-2-7b",
        "mistral-7b": "mistral-7b",
      },
      default_model: "llama2-7b",
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        model_templates: mockTemplates.model_templates,
        default_model: mockTemplates.default_model,
      },
      timestamp: expect.any(String),
    });
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining("model-templates.json"),
      "utf-8"
    );
    expect(validateConfig).toHaveBeenCalled();
  });

  it("should return 500 when file read fails", async () => {
    (readFile as jest.Mock).mockRejectedValueOnce(new Error("File not found"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Failed to load model templates",
      timestamp: expect.any(String),
    });
  });

  it("should return 200 with empty templates when validation fails", async () => {
    const mockTemplates = { invalid: "data" };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["Validation error 1", "Validation error 2"],
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
  });

  it("should return 500 when malformed JSON file", async () => {
    (readFile as jest.Mock).mockResolvedValueOnce("{ invalid json }");

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Failed to load model templates",
      timestamp: expect.any(String),
    });
  });

  it("should preserve existing config structure", async () => {
    const mockTemplates = {
      model_templates: {
        "llama2-7b": "llama-2-7b",
      },
      default_model: "llama2-7b",
      version: "1.0.0",
      metadata: { description: "Model templates config" },
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toBeDefined();
  });

  it("should handle file with only model_templates", async () => {
    const mockTemplates = {
      model_templates: {
        "model1": "template1",
      },
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual({ model_templates: mockTemplates.model_templates, default_model: null });
  });

  it("should include timestamp in response", async () => {
    const mockTemplates = {
      model_templates: {},
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.timestamp).toBeDefined();
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
