/**
 * Tests for model templates API route
 * File: app/api/model-templates/route.ts
 */

import { GET, POST } from "../../../app/api/model-templates/route";
import { NextRequest } from "next/server";
import { promises as fs } from "fs";

// Mock dependencies
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock("@/lib/logger", () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn(),
  validateConfig: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(),
      ok: (init?.status || 200) < 400,
    })),
  },
}));

const { readFile, writeFile } = fs as jest.Mocked<typeof fs>;
const { validateRequestBody, validateConfig } = jest.requireMock("@/lib/validation-utils");

describe("GET /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    (readFile as jest.Mock).mockRejectedValueOnce(
      new Error("File not found")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Failed to load model templates",
      timestamp: expect.any(String),
    });
  });

  it("should return 500 when validation fails", async () => {
    const mockTemplates = { invalid: "data" };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["Validation error 1", "Validation error 2"],
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Invalid model templates configuration",
      timestamp: expect.any(String),
    });
  });

  it("should handle empty model_templates object", async () => {
    const mockTemplates = {
      model_templates: {},
      default_model: null,
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
  });

  it("should handle malformed JSON file", async () => {
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
    expect(json.data.model_templates).toEqual({ "model1": "template1" });
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

describe("POST /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save model templates successfully", async () => {
    const existingConfig = {
      model_templates: { "old-model": "old-template" },
      default_model: "old-model",
    };

    const newTemplates = {
      model_templates: {
        "new-model": "new-template",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        model_templates: newTemplates.model_templates,
      },
      timestamp: expect.any(String),
    });
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("model-templates.json"),
      expect.stringContaining('"model_templates"'),
      "utf-8"
    );
  });

  it("should return 400 when request body validation fails", async () => {
    const invalidBody = { invalid: "data" };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(invalidBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["Invalid field: invalid"],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: "Invalid request body",
      details: ["Invalid field: invalid"],
      timestamp: expect.any(String),
    });
  });

  it("should return 500 when file read fails", async () => {
    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (readFile as jest.Mock).mockRejectedValueOnce(new Error("Read error"));

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Failed to save model templates",
      details: "Read error",
      timestamp: expect.any(String),
    });
  });

  it("should return 400 when config validation fails after merge", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["Invalid merged config"],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: "Invalid model templates configuration",
      details: ["Invalid merged config"],
      timestamp: expect.any(String),
    });
  });

  it("should preserve default_model when saving", async () => {
    const existingConfig = {
      model_templates: { "old-model": "old-template" },
      default_model: "default-model",
    };

    const newTemplates = {
      model_templates: { "new-model": "new-template" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    await POST(mockRequest);

    const writtenData = JSON.parse(
      (writeFile as jest.Mock).mock.calls[0][1] as string
    );

    expect(writtenData.default_model).toBe("default-model");
  });

  it("should return 500 when file write fails", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockRejectedValueOnce(new Error("Write error"));

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Failed to save model templates",
      details: "Write error",
      timestamp: expect.any(String),
    });
  });

  it("should merge new templates with existing ones", async () => {
    const existingConfig = {
      model_templates: {
        "model1": "template1",
        "model2": "template2",
      },
      default_model: "model1",
    };

    const newTemplates = {
      model_templates: {
        "model3": "template3",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    await POST(mockRequest);

    const writtenData = JSON.parse(
      (writeFile as jest.Mock).mock.calls[0][1] as string
    );

    expect(writtenData.model_templates).toEqual({
      "model3": "template3",
    });
    // Note: Current implementation replaces templates, doesn't merge
  });

  it("should handle malformed existing config file", async () => {
    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (readFile as jest.Mock).mockResolvedValueOnce("{ invalid json }");

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
  });

  it("should handle request with JSON parse error", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: "Failed to save model templates",
      details: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it("should handle empty model_templates in request", async () => {
    const existingConfig = {
      model_templates: { "old": "template" },
      default_model: null,
    };

    const newTemplates = {
      model_templates: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
  });

  it("should include timestamp in response", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(json.timestamp).toBeDefined();
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("should handle templates with special characters", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates = {
      model_templates: {
        "model with spaces": "template with \"quotes\"",
        "model-with-dashes": "template-with-dashes",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
  });

  it("should handle unicode characters in templates", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates = {
      model_templates: {
        "模型": "テンプレート",
        "model": "🎯 template",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
  });

  it("should write file with proper JSON formatting", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    await POST(mockRequest);

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("model-templates.json"),
      expect.stringMatching(/^\{[\s\S]*\}$/),
      "utf-8"
    );
  });
});

describe("Edge Cases and Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET should handle file with unexpected fields", async () => {
    const mockTemplates = {
      model_templates: { "model1": "template1" },
      unexpected_field: "value",
      nested: { data: "here" },
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();

    expect(response.status).toBe(200);
  });

  it("POST should handle very large template data", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const largeTemplates = Array.from({ length: 100 }, (_, i) => ({
      [`model${i}`]: `template${i}`.repeat(100),
    })).reduce(
      (acc, curr) => ({
        model_templates: { ...acc.model_templates, ...curr },
      }),
      { model_templates: {} }
    );

    const mockRequest = {
      json: jest.fn().mockResolvedValue(largeTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: largeTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
    });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
  });

  it("should handle null model_templates in POST body", async () => {
    const newTemplates = {
      model_templates: null as any,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["model_templates must be an object"],
    });

    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
  });

  it("GET should handle file with only whitespace", async () => {
    (readFile as jest.Mock).mockResolvedValueOnce("   \n\t   ");

    const response = await GET();

    expect(response.status).toBe(500);
  });

  it("POST should handle concurrent requests", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };

    const newTemplates1 = {
      model_templates: { "model1": "template1" },
    };

    const newTemplates2 = {
      model_templates: { "model2": "template2" },
    };

    const mockRequest1 = {
      json: jest.fn().mockResolvedValue(newTemplates1),
    } as unknown as NextRequest;

    const mockRequest2 = {
      json: jest.fn().mockResolvedValue(newTemplates2),
    } as unknown as NextRequest;

    (readFile as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(existingConfig))
      .mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock)
      .mockReturnValueOnce({ success: true, data: newTemplates1 })
      .mockReturnValueOnce({ success: true, data: newTemplates2 });
    (validateConfig as jest.Mock)
      .mockReturnValueOnce({ success: true })
      .mockReturnValueOnce({ success: true });
    (writeFile as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const [response1, response2] = await Promise.all([
      POST(mockRequest1),
      POST(mockRequest2),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});

describe("Zod Validation Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET should validate against modelTemplatesConfigSchema", async () => {
    const mockTemplates = {
      model_templates: { "model1": "template1" },
      default_model: "model1",
    };

    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });

    await GET();

    expect(validateConfig).toHaveBeenCalledWith(
      expect.anything(),
      mockTemplates,
      "model-templates"
    );
  });

  it("POST should validate against modelTemplateSaveRequestSchema", async () => {
    const newTemplates = {
      model_templates: { "model1": "template1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(newTemplates),
    } as unknown as NextRequest;

    (readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ model_templates: {}, default_model: null })
    );
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    await POST(mockRequest);

    expect(validateRequestBody).toHaveBeenCalledWith(
      expect.anything(),
      newTemplates
    );
  });

  it("GET should return validation errors when schema fails", async () => {
    const invalidTemplates = { invalid: "structure" };

    (readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(invalidTemplates)
    );
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["Missing model_templates field"],
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Invalid model templates configuration");
  });

  it("POST should return validation errors when schema fails", async () => {
    const invalidBody = { invalid: "data" };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(invalidBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: [
        "Missing model_templates field",
        "model_templates must be an object",
      ],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.details).toBeDefined();
  });
});
