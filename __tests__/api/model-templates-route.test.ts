import { GET, POST } from "../../app/api/model-templates/route";
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import { validateRequestBody, validateConfig } from "@/lib/validation-utils";
import { modelTemplatesConfigSchema, modelTemplateSaveRequestSchema } from "@/lib/validators";
import {
  getModelTemplatesConfig,
  updateModelTemplatesConfig,
  invalidateModelTemplatesCache,
} from "@/lib/model-templates-config";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("@/lib/validation-utils");
jest.mock("@/lib/model-templates-config");

describe("GET /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Return cached config successfully
  it("should return cached config successfully", async () => {
    const mockCachedConfig = {
      model_templates: {
        "llama-2-7b": {
          ctx_size: 4096,
          gpu_layers: 35,
        },
      },
      default_model: "llama-2-7b",
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(mockCachedConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual(mockCachedConfig.model_templates);
    expect(json.data.default_model).toBe(mockCachedConfig.default_model);
    expect(json.timestamp).toBeDefined();
  });

  // Positive test: Load config from disk on cache miss
  it("should load config from disk on cache miss", async () => {
    const mockFileContent = {
      model_templates: {
        "mistral-7b": {
          ctx_size: 8192,
        },
      },
      default_model: "mistral-7b",
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockFileContent)
    );
    (validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: mockFileContent,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(fs.readFile).toHaveBeenCalled();
    expect(validateConfig).toHaveBeenCalled();
  });

  // Positive test: Handle empty model templates
  it("should handle empty model templates", async () => {
    const mockCachedConfig = {
      model_templates: {},
      default_model: null,
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(mockCachedConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
    expect(json.data.default_model).toBeNull();
  });

  // Negative test: Return default on validation failure
  it("should return default templates when validation fails", async () => {
    const mockFileContent = {
      invalid: "data",
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockFileContent)
    );
    (validateConfig as jest.Mock).mockReturnValue({
      success: false,
      errors: [{ path: [], message: "Invalid config" }],
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual({});
    expect(json.data.default_model).toBeNull();
  });

  // Negative test: Return 500 on file read error
  it("should return 500 error when file read fails", async () => {
    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.readFile as jest.Mock).mockRejectedValue(
      new Error("File not found")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to load model templates");
  });

  // Edge case: Handle concurrent GET requests
  it("should handle concurrent GET requests", async () => {
    const mockCachedConfig = {
      model_templates: {},
      default_model: null,
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(mockCachedConfig);

    const responses = await Promise.all([GET(), GET(), GET()]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle large model templates config
  it("should handle large model templates config", async () => {
    const largeTemplates = Array.from({ length: 100 }, (_, i) => ({
      [`model-${i}`]: {
        ctx_size: 4096,
        gpu_layers: 35,
      },
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const mockCachedConfig = {
      model_templates: largeTemplates,
      default_model: "model-0",
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(mockCachedConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(json.data.model_templates)).toHaveLength(100);
  });
});

describe("POST /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Save model templates successfully
  it("should save model templates successfully", async () => {
    const requestBody = {
      model_templates: {
        "llama-2-7b": {
          ctx_size: 4096,
          gpu_layers: 35,
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });
    (getModelTemplatesConfig as jest.Mock).mockReturnValue({
      model_templates: requestBody.model_templates,
      default_model: null,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual(requestBody.model_templates);
    expect(updateModelTemplatesConfig).toHaveBeenCalledWith(requestBody);
    expect(invalidateModelTemplatesCache).toHaveBeenCalled();
  });

  // Positive test: Save empty model templates
  it("should save empty model templates", async () => {
    const requestBody = {
      model_templates: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual({});
  });

  // Negative test: Return 400 on validation failure
  it("should return 400 error when validation fails", async () => {
    const requestBody = {
      invalid: "data",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: [
        { path: ["model_templates"], message: "Invalid templates" },
      ],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid request body");
    expect(json.details).toBeDefined();
  });

  // Negative test: Return 500 on save error
  it("should return 500 error when save fails", async () => {
    const requestBody = {
      model_templates: {
        "test-model": {},
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });
    (updateModelTemplatesConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Save failed");
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to save model templates");
  });

  // Edge case: Handle invalid JSON
  it("should handle invalid JSON in request", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to save model templates");
  });

  // Edge case: Handle concurrent POST requests
  it("should handle concurrent POST requests", async () => {
    const requestBody = {
      model_templates: {
        "test-model": {},
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const responses = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle very large template data
  it("should handle very large template data", async () => {
    const largeTemplates = Array.from({ length: 1000 }, (_, i) => ({
      [`model-${i}`]: {
        ctx_size: 4096,
        gpu_layers: 35,
        custom: "x".repeat(100),
      },
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const requestBody = {
      model_templates: largeTemplates,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(json.data.model_templates)).toHaveLength(1000);
  });

  // Edge case: Handle template with special characters
  it("should handle template names with special characters", async () => {
    const requestBody = {
      model_templates: {
        "llama-2-7b-日本語-中文-العربية": {
          ctx_size: 4096,
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toHaveProperty(
      "llama-2-7b-日本語-中文-العربية"
    );
  });

  // Edge case: Handle nested template config
  it("should handle deeply nested template config", async () => {
    const requestBody = {
      model_templates: {
        "test-model": {
          ctx_size: 4096,
          gpu_layers: 35,
          sampling: {
            temp: 0.7,
            top_p: 0.9,
            top_k: 40,
          },
          memory: {
            batch_size: 512,
            ubatch_size: 128,
          },
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates["test-model"].ctx_size).toBe(4096);
  });
});
