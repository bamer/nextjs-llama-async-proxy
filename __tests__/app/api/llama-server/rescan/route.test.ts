import { POST } from "../../../../app/api/llama-server/rescan/route";
import { NextRequest } from "next/server";
import { validateRequestBody } from "@/lib/validation-utils";
import { getLogger } from "@/lib/logger";

jest.mock("@/lib/validation-utils");
jest.mock("@/lib/logger");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

describe("POST /api/llama-server/rescan", () => {
  let mockLlamaIntegration: {
    stop: jest.Mock;
    initialize: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as any).llamaIntegration = mockLlamaIntegration;
  });

  afterEach(() => {
    delete (global as any).llamaIntegration;
  });

  it("should rescan models successfully with valid config", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
      llamaServerPath: "/path/to/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: 4,
      gpu_layers: 35,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: mockConfig,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Models rescanned successfully");
    expect(json.config).toEqual({
      host: "localhost",
      port: 8134,
      basePath: "/models",
      serverPath: "/path/to/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: 4,
      gpu_layers: 35,
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalledTimes(1);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith("[API] ✅ Models rescanned successfully with config:", expect.any(Object));
  });

  it("should use default values when config is incomplete", async () => {
    const mockConfig = {
      host: "custom-host",
      port: 9999,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: mockConfig,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledWith({
      host: "custom-host",
      port: 9999,
      basePath: "/models", // default
      serverPath: "/home/bamer/llama.cpp/build/bin/llama-server", // default
      ctx_size: 8192, // default
      batch_size: 512, // default
      threads: -1, // default
      gpu_layers: -1, // default
    });
  });

  it("should return 400 when request body validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid host format"],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid request body");
    expect(json.details).toEqual(["Invalid host format"]);
    expect(mockLlamaIntegration.stop).not.toHaveBeenCalled();
    expect(mockLlamaIntegration.initialize).not.toHaveBeenCalled();
  });

  it("should return 503 when llama service is not initialized", async () => {
    delete (global as any).llamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe("Llama service not initialized");
  });

  it("should return 500 when stop operation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    mockLlamaIntegration.stop.mockRejectedValue(new Error("Stop failed"));

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to rescan models");
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Error rescanning models:", expect.any(Error));
  });

  it("should return 500 when initialize operation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    mockLlamaIntegration.initialize.mockRejectedValue(new Error("Initialize failed"));

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to rescan models");
  });

  it("should handle empty request body", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockLlamaIntegration.stop).toHaveBeenCalledTimes(1);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledTimes(1);
  });

  it("should handle invalid JSON in request body", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to rescan models");
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Error rescanning models:", expect.any(Error));
  });

  it("should handle environment variable overrides", async () => {
    // Mock environment variables
    process.env.LLAMA_SERVER_HOST = "env-host";
    process.env.LLAMA_SERVER_PORT = "9999";
    process.env.MODELS_PATH = "/env/models";
    process.env.LLAMA_SERVER_PATH = "/env/llama-server";

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledWith({
      host: "env-host",
      port: 9999,
      basePath: "/env/models",
      serverPath: "/env/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    });

    // Clean up
    delete process.env.LLAMA_SERVER_HOST;
    delete process.env.LLAMA_SERVER_PORT;
    delete process.env.MODELS_PATH;
    delete process.env.LLAMA_SERVER_PATH;
  });
});