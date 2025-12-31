jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn(),
  validateConfig: jest.fn(),
}));

import { GET, POST } from "../../app/api/model-templates/route";
import { NextRequest } from "next/server";
import fs from "fs/promises";
import * as validationUtils from "@/lib/validation-utils";

describe("GET /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return model templates successfully", async () => {
    const mockTemplates = {
      model_templates: {
        "llama2-7b": "llama-2-7b",
        "llama3-8b": "llama-3-8b",
      },
      default_model: null,
    };

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockTemplates)
    );
    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data.model_templates).toEqual({
      "llama2-7b": "llama-2-7b",
      "llama3-8b": "llama-3-8b",
    });
    expect(fs.readFile).toHaveBeenCalled();
    expect(validationUtils.validateConfig).toHaveBeenCalled();
  });

  it("should return empty model templates when none exist", async () => {
    const mockTemplates = {
      model_templates: {},
      default_model: null,
    };

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockTemplates)
    );
    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: mockTemplates,
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data.model_templates).toEqual({});
  });

  it("should return 500 when file read fails", async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(
      new Error("File not found")
    );

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.success).toBe(false);
    expect(_json.error).toBe("Failed to load model templates");
  });

  it("should return 500 when validation fails", async () => {
    const mockTemplates = {
      model_templates: { invalid: "data" },
      default_model: null,
    };

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockTemplates)
    );
    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid template format"],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.success).toBe(false);
    expect(_json.error).toBe("Invalid model templates configuration");
  });

  it("should handle JSON parse errors", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue("invalid json");

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.success).toBe(false);
    expect(_json.error).toBe("Failed to load model templates");
  });
});

describe("POST /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save model templates successfully", async () => {
    const requestBody = {
      model_templates: {
        "custom-model": "custom-template",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    const existingConfig = {
      model_templates: {
        "existing-model": "existing-template",
      },
      default_model: null,
    };

    (validationUtils.validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(existingConfig)
    );

    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: { ...existingConfig, model_templates: requestBody.model_templates },
    });

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data.model_templates).toEqual({
      "custom-model": "custom-template",
    });
    expect(fs.writeFile).toHaveBeenCalled();
    expect(validationUtils.validateRequestBody).toHaveBeenCalled();
    expect(validationUtils.validateConfig).toHaveBeenCalled();
  });

  it("should preserve default_model when saving templates", async () => {
    const requestBody = {
      model_templates: {
        "new-model": "new-template",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    const existingConfig = {
      model_templates: {},
      default_model: "llama3-8b",
    };

    (validationUtils.validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(existingConfig)
    );

    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: { ...existingConfig, model_templates: requestBody.model_templates },
    });

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await POST(mockRequest);

    const writeCallArgs = (fs.writeFile as jest.Mock).mock.calls[0];
    const savedConfig = JSON.parse(writeCallArgs[1]);

    expect(savedConfig.default_model).toBe("llama3-8b");
    expect(savedConfig.model_templates).toEqual(requestBody.model_templates);
  });

  it("should handle empty model_templates object", async () => {
    const requestBody = {
      model_templates: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    const existingConfig = {
      model_templates: { old: "template" },
      default_model: null,
    };

    (validationUtils.validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(existingConfig)
    );

    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: { ...existingConfig, model_templates: {} },
    });

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data.model_templates).toEqual({});
  });

  it("should handle large number of templates", async () => {
    const requestBody = {
      model_templates: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
          `model-${i}`,
          `template-${i}`,
        ])
      ),
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validationUtils.validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ model_templates: {}, default_model: null })
    );

    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: {
        model_templates: requestBody.model_templates,
        default_model: null,
      },
    });

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(_json.data.model_templates || {}).length).toBe(100);
  });

  it("should handle concurrent POST requests", async () => {
    const requestBody = {
      model_templates: { "model-1": "template-1" },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validationUtils.validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ model_templates: {}, default_model: null })
    );

    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: {
        model_templates: requestBody.model_templates,
        default_model: null,
      },
    });

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const [response1, response2] = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it("should include timestamp in response", async () => {
    const requestBody = {
      model_templates: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validationUtils.validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ model_templates: {}, default_model: null })
    );

    (validationUtils.validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: { model_templates: {}, default_model: null },
    });

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(_json).toHaveProperty("timestamp");
    expect(typeof _json.timestamp).toBe("string");
    expect(new Date(_json.timestamp)).toBeInstanceOf(Date);
  });
});
