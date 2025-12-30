import { POST } from "../../app/api/llama-server/rescan/route";
import { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn(),
}));

describe("POST /api/llama-server/rescan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully rescan models with provided config
  it("should rescan models successfully with provided config", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
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
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Models rescanned successfully",
      config: {
        host: "localhost",
        port: 8134,
        basePath: "/models",
        serverPath: "/path/to/llama-server",
        ctx_size: 8192,
        batch_size: 512,
        threads: 4,
        gpu_layers: 35,
      },
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalled();
    expect(mockLlamaIntegration.initialize).toHaveBeenCalled();
  });

  // Positive test: Successfully rescan models with partial config
  it("should rescan models successfully with partial config (use defaults)", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "custom-host",
      port: "9000",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.host).toBe("custom-host");
    expect(json.config.port).toBe(9000);
    expect(json.config.basePath).toBe("/models");
    expect(json.config.serverPath).toContain("llama-server");
  });

  // Negative test: Return 503 when llamaIntegration is not available
  it("should return 503 when llamaIntegration is not available", async () => {
    (global as unknown as { llamaIntegration: unknown }).llamaIntegration = undefined;

    const mockBody = {
      host: "localhost",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "Llama service not initialized",
    });
  });

  // Negative test: Return 400 when validation fails
  it("should return 400 when validation fails", async () => {
    const mockBody = {
      invalid: "data",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({
      success: false,
      errors: ["Invalid host", "Invalid port"],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Invalid request body",
      details: ["Invalid host", "Invalid port"],
    });
  });

  // Negative test: Handle error in stop
  it("should return 500 when stop throws error", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockRejectedValue(new Error("Stop failed")),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "localhost",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to rescan models",
    });
  });

  // Negative test: Handle error in initialize
  it("should return 500 when initialize throws error", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockRejectedValue(new Error("Initialize failed")),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "localhost",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to rescan models",
    });
  });

  // Positive test: Use environment variables as defaults
  it("should use environment variables as defaults", async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      LLAMA_SERVER_HOST: "env-host",
      LLAMA_SERVER_PORT: "9999",
      MODELS_PATH: "/env/models",
      LLAMA_SERVER_PATH: "/env/server",
    };

    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {};

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.host).toBe("env-host");
    expect(json.config.port).toBe(9999);
    expect(json.config.basePath).toBe("/env/models");
    expect(json.config.serverPath).toBe("/env/server");

    process.env = originalEnv;
  });

  // Edge case: Handle port as string and convert to number
  it("should convert port string to number", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      port: "12345",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBe(12345);
    expect(typeof json.config.port).toBe("number");
  });

  // Edge case: Handle validation data as null or undefined
  it("should handle validation data as null or undefined", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: null });

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
  });

  // Positive test: Handle full configuration with all parameters
  it("should handle full configuration with all parameters", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "test-host",
      port: 8888,
      modelsPath: "/test/path",
      llamaServerPath: "/test/llama-server",
      ctx_size: 16384,
      batch_size: 1024,
      threads: 8,
      gpu_layers: 40,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config).toMatchObject({
      host: "test-host",
      port: 8888,
      basePath: "/test/path",
      serverPath: "/test/llama-server",
      ctx_size: 16384,
      batch_size: 1024,
      threads: 8,
      gpu_layers: 40,
    });
  });

  // Edge case: Handle concurrent rescan requests
  it("should handle concurrent rescan requests", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "localhost",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: mockBody });

    const [response1, response2, response3] = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(200);
  });

  // Edge case: Handle validation returning undefined data
  it("should handle validation returning undefined data", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = require("@/lib/validation-utils");
    validateRequestBody.mockReturnValue({ success: true, data: undefined });

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
  });
});
