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

describe("POST /api/llama-server/rescan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive test: Successfully rescan models
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

    const expectedConfig = {
      host: "localhost",
      port: 8134,
      basePath: "/models",
      serverPath: "/path/to/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: 4,
      gpu_layers: 35,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      message: "Models rescanned successfully",
      config: expectedConfig,
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalledTimes(1);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledWith(expectedConfig);
    expect(console.log).toHaveBeenCalledWith(
      "[API] Rescanning models - restarting llama-server..."
    );
  });

  // Positive test: Use environment variables as defaults
  it("should use environment variables as defaults when body is empty", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const expectedConfig = {
      host: "localhost",
      port: 8134,
      basePath: "/models",
      serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config).toMatchObject(expectedConfig);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledWith(
      expect.objectContaining(expectedConfig)
    );
  });

  // Positive test: Use provided config values over defaults
  it("should use provided config values over defaults", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "custom-host",
      port: 9999,
      modelsPath: "/custom/models",
      llamaServerPath: "/custom/server",
      ctx_size: 16384,
      batch_size: 1024,
      threads: 8,
      gpu_layers: 40,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.host).toBe("custom-host");
    expect(json.config.port).toBe(9999);
    expect(json.config.ctx_size).toBe(16384);
  });

  // Negative test: Return 503 when llamaIntegration is not initialized
  it("should return 503 error when llamaIntegration is not initialized", async () => {
    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      undefined;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "Llama service not initialized",
    });
  });

  // Negative test: Handle stop() failure
  it("should handle stop() failure gracefully", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockRejectedValue(new Error("Stop failed")),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to rescan models",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[API] Error rescanning models:",
      expect.any(Error)
    );
  });

  // Negative test: Handle initialize() failure
  it("should handle initialize() failure gracefully", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest
        .fn()
        .mockRejectedValue(new Error("Initialize failed")),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to rescan models",
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalled();
    expect(mockLlamaIntegration.initialize).toHaveBeenCalled();
  });

  // Positive test: Handle empty body gracefully (defaults to environment variables)
  it("should handle empty body gracefully by using defaults", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      message: "Models rescanned successfully",
      config: expect.objectContaining({
        host: expect.any(String),
        port: expect.any(Number),
        basePath: expect.any(String),
        serverPath: expect.any(String),
      }),
    });
  });

  // Positive test: Parse port as integer
  it("should parse port as integer", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      port: "8134",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBe(8134);
    expect(typeof json.config.port).toBe("number");
  });

  // Positive test: Log success message
  it("should log success message with config", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "test-host",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const logSpy = jest.spyOn(console, "log");

    await POST(mockRequest);

    expect(logSpy).toHaveBeenCalledWith(
      "[API] ✅ Models rescanned successfully with config:",
      expect.objectContaining(mockBody)
    );
  });

  // Positive test: Handle partial config
  it("should handle partial config with defaults", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "custom-host",
      ctx_size: 16384,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.host).toBe("custom-host");
    expect(json.config.ctx_size).toBe(16384);
    expect(json.config.port).toBeDefined();
    expect(json.config.threads).toBeDefined();
  });
});
