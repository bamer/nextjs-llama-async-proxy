import { GET, POST } from "../app/api/config/route";
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
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
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
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ serverConfig: {}, appConfig: {} });
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
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
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
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
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
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
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
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
      serverConfig: mockServerConfig,
    });
    expect(validateRequestBody).toHaveBeenCalledWith(
      configUpdateRequestSchema,
      { serverConfig: mockServerConfig }
    );
    expect(saveConfig).toHaveBeenCalledWith(mockServerConfig);
    expect(loadConfig).toHaveBeenCalled();
  });

  // Positive test: Save appConfig only
  it("should save appConfig successfully", async () => {
    const mockAppConfig = {
      maxConcurrentModels: 3,
      logLevel: "debug",
      autoUpdate: true,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ appConfig: mockAppConfig }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: undefined, appConfig: mockAppConfig },
    });
    (saveAppConfig as jest.Mock).mockImplementation(() => {});
    (loadAppConfig as jest.Mock).mockReturnValue(mockAppConfig);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
      appConfig: mockAppConfig,
    });
    expect(saveAppConfig).toHaveBeenCalledWith(mockAppConfig);
    expect(loadAppConfig).toHaveBeenCalled();
  });

  // Positive test: Save both serverConfig and appConfig
  it("should save both serverConfig and appConfig successfully", async () => {
    const mockServerConfig = { host: "localhost", port: 8134 };
    const mockAppConfig = { maxConcurrentModels: 2, logLevel: "info" };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        serverConfig: mockServerConfig,
        appConfig: mockAppConfig,
      }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: mockServerConfig, appConfig: mockAppConfig },
    });
    (saveConfig as jest.Mock).mockImplementation(() => {});
    (saveAppConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(mockAppConfig);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
      serverConfig: mockServerConfig,
      appConfig: mockAppConfig,
    });
    expect(saveConfig).toHaveBeenCalledWith(mockServerConfig);
    expect(saveAppConfig).toHaveBeenCalledWith(mockAppConfig);
  });

  // Positive test: Handle empty serverConfig object (should not save)
  it("should handle empty serverConfig object (should not save)", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ serverConfig: {} }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: {}, appConfig: undefined },
    });
    (loadConfig as jest.Mock).mockReturnValue({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
    });
    expect(saveConfig).not.toHaveBeenCalled();
  });

  // Positive test: Handle empty appConfig object (should not save)
  it("should handle empty appConfig object (should not save)", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ appConfig: {} }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: undefined, appConfig: {} },
    });
    (loadAppConfig as jest.Mock).mockReturnValue({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
    });
    expect(saveAppConfig).not.toHaveBeenCalled();
  });

  // Negative test: Return 400 when validation fails
  it("should return 400 error when validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: [
        { path: ["serverConfig"], message: "Invalid configuration" },
      ],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Invalid request body",
      details: [{ path: ["serverConfig"], message: "Invalid configuration" }],
    });
  });

  // Negative test: Return 400 when both configs are missing
  it("should return 400 error when both appConfig and serverConfig are missing", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: [
        { message: "At least one of appConfig or serverConfig must be provided" },
      ],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid request body");
  });

  // Negative test: Return 500 when saveConfig fails
  it("should return 500 error when saveConfig throws", async () => {
    const mockServerConfig = { host: "localhost", port: 8134 };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ serverConfig: mockServerConfig }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: mockServerConfig, appConfig: undefined },
    });
    (saveConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to save config");
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
      details: "Failed to save config",
    });
  });

  // Negative test: Return 500 when saveAppConfig fails
  it("should return 500 error when saveAppConfig throws", async () => {
    const mockAppConfig = { maxConcurrentModels: 2 };

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ appConfig: mockAppConfig }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { serverConfig: undefined, appConfig: mockAppConfig },
    });
    (saveAppConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to save app config");
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
      details: "Failed to save app config",
    });
  });

  // Negative test: Handle invalid JSON in request body
  it("should handle invalid JSON in request body", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
    });
  });

  // Edge case: Handle configuration with special characters
  it("should handle configuration with special characters", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/path/with spaces/model",
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
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.serverConfig).toEqual(mockServerConfig);
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
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.serverConfig).toEqual(mockServerConfig);
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
    const json = await response.json();

    expect(response.status).toBe(200);
  });
});
