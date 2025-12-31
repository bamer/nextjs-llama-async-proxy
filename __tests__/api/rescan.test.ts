import { POST } from "../../app/api/llama-server/rescan/route";
import { NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";

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
    debug: jest.fn(),
  })),
}));

describe("POST /api/llama-server/rescan", () => {
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
    (getLogger as jest.Mock).mockReturnValue(mockLogger);
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toMatchObject({
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config).toMatchObject(expectedConfig);
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.host).toBe("custom-host");
    expect(_json.config.port).toBe(9999);
    expect(_json.config.ctx_size).toBe(16384);
  });

  // Negative test: Return 503 when llamaIntegration is not initialized
  it("should return 503 error when llamaIntegration is not initialized", async () => {
    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      undefined;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toEqual({
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
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toEqual({
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
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toEqual({
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toMatchObject({
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBe(8134);
    expect(typeof _json.config.port).toBe("number");
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.host).toBe("custom-host");
    expect(_json.config.ctx_size).toBe(16384);
    expect(_json.config.port).toBeDefined();
    expect(_json.config.threads).toBeDefined();
  });

  // Edge case: Handle invalid port number (negative)
  it("should handle invalid negative port number", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      port: -1,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    // Port parsing should still work (will be -1)
    expect(_json.config.port).toBe(-1);
  });

  // Edge case: Handle port larger than max range
  it("should handle port larger than max range", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      port: 999999,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBe(999999);
  });

  // Edge case: Handle port as string
  it("should handle port as string value", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      port: "8080",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(typeof _json.config.port).toBe("number");
    expect(_json.config.port).toBe(8080);
  });

  // Edge case: Handle negative values for numeric config options
  it("should handle negative values for numeric config options", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      ctx_size: -100,
      batch_size: -50,
      threads: -10,
      gpu_layers: -5,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.ctx_size).toBe(-100);
    expect(_json.config.batch_size).toBe(-50);
    expect(_json.config.threads).toBe(-10);
    expect(_json.config.gpu_layers).toBe(-5);
  });

  // Edge case: Handle extremely large config values
  it("should handle extremely large numeric config values", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      ctx_size: Number.MAX_SAFE_INTEGER,
      batch_size: Number.MAX_SAFE_INTEGER,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.ctx_size).toBe(Number.MAX_SAFE_INTEGER);
  });

  // Edge case: Handle concurrent rescan requests
  it("should handle concurrent rescan requests", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const responses = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle paths with special characters
  it("should handle paths with special characters", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      modelsPath: "/path/with spaces & special@chars#test",
      llamaServerPath: "/another/path with-特殊.chars",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.basePath).toContain("spaces");
  });

  // Edge case: Handle port as NaN
  it("should handle port as NaN", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      port: "not-a-number",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBeNaN();
  });

  // Edge case: Handle rescan with conflicting config options
  it("should handle rescan with conflicting config options", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: "localhost",
      port: 8134,
      ctx_size: 16384,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle environment variables with invalid values
  it("should use environment variables even if invalid", async () => {
    process.env.LLAMA_SERVER_PORT = "invalid-port";

    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.config.port).toBeNaN();

    delete process.env.LLAMA_SERVER_PORT;
  });

  // Edge case: Handle very long config paths
  it("should handle very long config paths", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const longPath = "/a".repeat(5000);
    const mockBody = {
      modelsPath: longPath,
      llamaServerPath: longPath,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle config with null values
  it("should handle config with null values", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockBody = {
      host: null,
      port: null,
      modelsPath: null,
      ctx_size: null,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle stop throwing error with stack
  it("should handle stop error with detailed stack", async () => {
    const mockLlamaIntegration = {
      stop: jest.fn().mockImplementation(() => {
        const error = new Error("Detailed error");
        error.stack = "Error: Detailed error\n    at stack trace";
        throw error;
      }),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      mockLlamaIntegration;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.error).toBe("Failed to rescan models");
  });
});
