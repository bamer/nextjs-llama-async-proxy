import { GET, POST } from "../../app/api/config/route";
import { NextRequest } from "next/server";
import { loadConfig, saveConfig, loadAppConfig, saveAppConfig } from "@/lib/server-config";
import { validateRequestBody } from "@/lib/validation-utils";
import { configUpdateRequestSchema } from "@/lib/validators";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/server-config");
jest.mock("@/lib/validation-utils");

describe("GET /api/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully retrieve both configs
  it("should return both serverConfig and appConfig successfully", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
      llamaServerPath: "/path/to/llama-server",
    };

    const mockAppConfig = {
      maxConcurrentModels: 2,
      logLevel: "info",
      autoUpdate: false,
      notificationsEnabled: true,
    };

    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(mockAppConfig);

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toEqual({
      serverConfig: mockServerConfig,
      appConfig: mockAppConfig,
    });
    expect(loadConfig).toHaveBeenCalledTimes(1);
    expect(loadAppConfig).toHaveBeenCalledTimes(1);
  });

  // Positive test: Handle empty configuration
  it("should handle empty configuration", async () => {
    const mockConfig = {};

    (loadConfig as jest.Mock).mockReturnValue(mockConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(mockConfig);

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toEqual({ serverConfig: {}, appConfig: {} });
  });

  // Positive test: Handle complex configuration object
  it("should handle complex configuration object", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
      llamaServerPath: "/path/to/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: 4,
      gpu_layers: 35,
    };

    const mockAppConfig = {
      maxConcurrentModels: 3,
      logLevel: "debug",
      autoUpdate: true,
      notificationsEnabled: false,
    };

    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(mockAppConfig);

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toEqual({
      serverConfig: mockServerConfig,
      appConfig: mockAppConfig,
    });
  });

  // Negative test: Return 500 when loadConfig fails
  it("should return 500 error when loadConfig throws", async () => {
    (loadConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to load config");
    });
    (loadAppConfig as jest.Mock).mockReturnValue({});

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toEqual({
      error: "Failed to get config",
    });
    expect(loadConfig).toHaveBeenCalledTimes(1);
  });

  // Negative test: Return 500 when loadAppConfig fails
  it("should return 500 error when loadAppConfig throws", async () => {
    (loadConfig as jest.Mock).mockReturnValue({});
    (loadAppConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to load app config");
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toEqual({
      error: "Failed to get config",
    });
  });
});

describe("POST /api/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Save serverConfig only
  it("should save serverConfig successfully", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ serverConfig: mockServerConfig }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: mockServerConfig, appConfig: undefined },
    });
    (saveConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.serverConfig).toEqual(mockServerConfig);
  });

  // Edge case: Handle very large configuration object
  it("should handle very large configuration object", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      ...Array.from({ length: 100 }, (_, i) => ({
        [`prop_${i}`]: `value_${i}`.repeat(10),
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ serverConfig: mockServerConfig }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: mockServerConfig, appConfig: undefined },
    });
    (saveConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.serverConfig).toEqual(mockServerConfig);
  });

  // Edge case: Handle concurrent save requests
  it("should handle concurrent save requests", async () => {
    const mockConfig1 = { serverConfig: { host: "localhost", port: 8134 } };
    const mockConfig2 = { serverConfig: { host: "localhost", port: 8135 } };

    const mockRequest1 = {
      json: jest.fn().mockResolvedValue(mockConfig1),
    } as unknown as NextRequest;

    const mockRequest2 = {
      json: jest.fn().mockResolvedValue(mockConfig2),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock)
      .mockReturnValueOnce({ success: true, data: mockConfig1 })
      .mockReturnValueOnce({ success: true, data: mockConfig2 });
    (saveConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue({});

    const [response1, response2] = await Promise.all([
      POST(mockRequest1),
      POST(mockRequest2),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  // Edge case: Handle configuration with deeply nested objects
  it("should handle deeply nested configuration objects", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      level1: {
        level2: {
          level3: {
            value: "deep",
          },
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ serverConfig: mockServerConfig }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: mockServerConfig, appConfig: undefined },
    });
    (saveConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);

    const response = await POST(mockRequest);
    const _json = await response.json();

    expect(response.status).toBe(200);
  });
});
