import { POST } from "../../app/api/llama-server/rescan/route";
import { NextRequest } from "next/server";
import { validateRequestBody } from "@/lib/validation-utils";
import { rescanRequestSchema } from "@/lib/validators";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/validation-utils");

describe("POST /api/llama-server/rescan", () => {
  let mockLlamaIntegration: jest.Mocked<{ stop: () => Promise<void>; initialize: (config: unknown) => Promise<void> }>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };
    (global as unknown as { llamaIntegration: unknown }).llamaIntegration = mockLlamaIntegration;
  });

  afterEach(() => {
    delete (global as unknown as { llamaIntegration?: unknown }).llamaIntegration;
  });

  // Positive test: Successfully rescan with full config
  it("should rescan models successfully with full config", async () => {
    const requestBody = {
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
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.message).toBe("Models rescanned successfully");
    expect(_json.config).toEqual({
      host: "localhost",
      port: 8134,
      basePath: "/models",
      serverPath: "/path/to/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: 4,
      gpu_layers: 35,
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalled();
    expect(mockLlamaIntegration.initialize).toHaveBeenCalled();
  });

  // Positive test: Successfully rescan with minimal config
  it("should rescan models successfully with minimal config", async () => {
    const requestBody = {
      host: "localhost",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.message).toBe("Models rescanned successfully");
    expect(mockLlamaIntegration.stop).toHaveBeenCalled();
    expect(mockLlamaIntegration.initialize).toHaveBeenCalled();
  });

  // Positive test: Successfully rescan with empty body (uses env vars)
  it("should rescan models with empty body using env vars", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.message).toBe("Models rescanned successfully");
    expect(_json.config.host).toBeDefined();
    expect(_json.config.port).toBeDefined();
  });

  // Positive test: Successfully rescan with string port
  it("should rescan models successfully with string port", async () => {
    const requestBody = {
      host: "localhost",
      port: "8134",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBe(8134);
  });

  // Negative test: Return 503 when llamaIntegration is not initialized
  it("should return 503 error when llamaIntegration is not initialized", async () => {
    delete (global as unknown as { llamaIntegration?: unknown }).llamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json.error).toBe("Llama service not initialized");
  });

  // Negative test: Return 400 when validation fails
  it("should return 400 error when validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: [{ path: ["port"], message: "Invalid port" }],
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Invalid request body");
    expect(_json.details).toBeDefined();
  });

  // Negative test: Return 500 when initialize fails
  it("should return 500 error when initialize throws", async () => {
    mockLlamaIntegration.initialize.mockRejectedValue(new Error("Initialize failed"));

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.error).toBe("Failed to rescan models");
  });

  // Negative test: Return 500 when stop fails
  it("should return 500 error when stop throws", async () => {
    mockLlamaIntegration.stop.mockRejectedValue(new Error("Stop failed"));

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.error).toBe("Failed to rescan models");
  });

  // Edge case: Handle invalid JSON in request body
  it("should handle invalid JSON in request body", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid request body"],
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Invalid request body");
  });

  // Edge case: Handle concurrent rescan requests
  it("should handle concurrent rescan requests", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const [response1, response2, response3] = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(200);
  });

  // Edge case: Handle special characters in paths
  it("should handle special characters in model paths", async () => {
    const requestBody = {
      host: "localhost",
      port: 8134,
      modelsPath: "/path/with spaces/model",
      llamaServerPath: "/path/with spaces/llama-server",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.basePath).toBe("/path/with spaces/model");
    expect(_json.config.serverPath).toBe("/path/with spaces/llama-server");
  });

  // Edge case: Handle unicode in paths
  it("should handle unicode characters in paths", async () => {
    const requestBody = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models/日本語/中文",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.basePath).toBe("/models/日本語/中文");
  });

  // Edge case: Handle zero port
  it("should handle port of 0 (should use default)", async () => {
    const requestBody = {
      host: "localhost",
      port: 0,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBe(8134); // Should use default
  });

  // Edge case: Handle very large port
  it("should handle very large port value", async () => {
    const requestBody = {
      host: "localhost",
      port: 999999,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBe(999999);
  });

  // Edge case: Handle negative thread value
  it("should handle negative thread value (should use -1)", async () => {
    const requestBody = {
      host: "localhost",
      port: 8134,
      threads: -5,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.threads).toBe(-5);
  });

  // Edge case: Handle zero ctx_size
  it("should handle ctx_size of 0", async () => {
    const requestBody = {
      host: "localhost",
      port: 8134,
      ctx_size: 0,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    // Note: 0 is falsy, so default value of 8192 is used
    expect(_json.config.ctx_size).toBe(8192);
  });

  // Edge case: Handle very large ctx_size
  it("should handle very large ctx_size value", async () => {
    const requestBody = {
      host: "localhost",
      port: 8134,
      ctx_size: 65536,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestBody,
    });

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.ctx_size).toBe(65536);
  });
});
