import { POST } from "../../../app/api/llama-server/rescan/route";
import {
  setupMockLlamaIntegration,
  createMockRequest,
  resetGlobalMocks,
} from "./rescan.test-utils";

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
    info: jest.fn((...args: unknown[]) => console.log(...args)),
    error: jest.fn((...args: unknown[]) => console.error(...args)),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn((_schema, data) => ({ success: true, data })),
}));

describe("POST /api/llama-server/rescan - Success Cases", () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    resetGlobalMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("should rescan models successfully with provided config", async () => {
    const mockLlamaIntegration = setupMockLlamaIntegration();

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

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      message: "Models rescanned successfully",
      config: expectedConfig,
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalledTimes(1);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledWith(
      expectedConfig
    );
  });

  it("should use environment variables as defaults when body is empty", async () => {
    const mockLlamaIntegration = setupMockLlamaIntegration();

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

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config).toMatchObject(expectedConfig);
    expect(mockLlamaIntegration.initialize).toHaveBeenCalledWith(
      expect.objectContaining(expectedConfig)
    );
  });

  it("should use provided config values over defaults", async () => {
    setupMockLlamaIntegration();

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

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.host).toBe("custom-host");
    expect(json.config.port).toBe(9999);
    expect(json.config.ctx_size).toBe(16384);
  });

  it("should handle empty body gracefully by using defaults", async () => {
    setupMockLlamaIntegration();

    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as import("next/server").NextRequest;

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

  it("should parse port as integer", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      port: "8134",
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBe(8134);
    expect(typeof json.config.port).toBe("number");
  });

  it("should log success message with config", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      host: "test-host",
      port: 8134,
    };

    const mockRequest = createMockRequest(mockBody);

    await POST(mockRequest);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "[API] ✅ Models rescanned successfully with config:",
      expect.objectContaining(mockBody)
    );
  });

  it("should handle partial config with defaults", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      host: "custom-host",
      ctx_size: 16384,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.host).toBe("custom-host");
    expect(json.config.ctx_size).toBe(16384);
    expect(json.config.port).toBeDefined();
    expect(json.config.threads).toBeDefined();
  });
});
