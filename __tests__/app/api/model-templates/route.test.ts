import { GET, POST } from "../../../../app/api/model-templates/route";
import { NextRequest } from "next/server";
import { validateRequestBody, validateConfig } from "@/lib/validation-utils";
import { getLogger } from "@/lib/logger";
import { getModelTemplatesConfig, updateModelTemplatesConfig, invalidateModelTemplatesCache } from "@/lib/model-templates-config";
import fs from "fs";

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("@/lib/validation-utils");
jest.mock("@/lib/logger");
jest.mock("@/lib/model-templates-config");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

describe("GET /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return cached model templates successfully", async () => {
    const cachedConfig = {
      model_templates: {
        "llama-7b": {
          model_name: "llama-7b",
          ctx_size: 4096,
          gpu_layers: 35,
        },
      },
      default_model: "llama-7b",
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(cachedConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(cachedConfig);
    expect(json.timestamp).toBeDefined();
    expect(getModelTemplatesConfig).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Config cache hit, returning cached config");
  });

  it("should load and return model templates from disk on cache miss", async () => {
    const diskConfig = {
      model_templates: {
        "llama-13b": {
          model_name: "llama-13b",
          ctx_size: 8192,
          gpu_layers: 40,
        },
      },
      default_model: null,
    };

    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(diskConfig));
    (validateConfig as jest.Mock).mockReturnValue({
      success: true,
      data: diskConfig,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual(diskConfig.model_templates);
    expect(json.data.default_model).toBe(null);
    expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Config cache miss, loading from disk");
  });

  it("should return default empty templates when disk validation fails", async () => {
    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ invalid: "data" }));
    (validateConfig as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid schema"],
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual({});
    expect(json.data.default_model).toBe(null);
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Invalid config loaded from disk:", ["Invalid schema"]);
  });

  it("should handle file read errors", async () => {
    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to load model templates");
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Error loading model templates:", expect.any(Error));
  });

  it("should handle JSON parse errors", async () => {
    (getModelTemplatesConfig as jest.Mock).mockReturnValue(null);
    (fs.promises.readFile as jest.Mock).mockResolvedValue("invalid json");

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to load model templates");
  });
});

describe("POST /api/model-templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save model templates successfully", async () => {
    const requestData = {
      model_templates: {
        "llama-7b": {
          model_name: "llama-7b",
          ctx_size: 4096,
          gpu_layers: 35,
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (getModelTemplatesConfig as jest.Mock).mockReturnValue({
      model_templates: requestData.model_templates,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual(requestData.model_templates);
    expect(updateModelTemplatesConfig).toHaveBeenCalledWith({ model_templates: requestData.model_templates });
    expect(invalidateModelTemplatesCache).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Saving model templates configuration");
  });

  it("should return 400 when request validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid model_templates format"],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid request body");
    expect(json.details).toEqual(["Invalid model_templates format"]);
    expect(updateModelTemplatesConfig).not.toHaveBeenCalled();
    expect(invalidateModelTemplatesCache).not.toHaveBeenCalled();
  });

  it("should handle JSON parse errors in request", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to save model templates");
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Error saving model templates:", expect.any(Error));
  });

  it("should handle update config errors", async () => {
    const requestData = {
      model_templates: {
        "llama-7b": {
          model_name: "llama-7b",
          ctx_size: 4096,
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (updateModelTemplatesConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Update failed");
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to save model templates");
  });

  it("should handle empty model templates", async () => {
    const requestData = {
      model_templates: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (getModelTemplatesConfig as jest.Mock).mockReturnValue({
      model_templates: {},
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual({});
  });
});