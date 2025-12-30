import { GET, POST } from "../../../../app/api/config/route";
import { NextRequest } from "next/server";
import { loadConfig, saveConfig, loadAppConfig, saveAppConfig } from "@/lib/server-config";
import { validateRequestBody } from "@/lib/validation-utils";

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

  it("should return configuration successfully", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
      llamaServerPath: "/path/to/llama-server",
    };

    const mockAppConfig = {
      theme: "dark",
      language: "en",
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
  });

  it("should return 500 error when loadConfig throws", async () => {
    (loadConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to load config");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to get config",
    });
    expect(loadConfig).toHaveBeenCalledTimes(1);
  });

  it("should handle empty configuration", async () => {
    const mockServerConfig = {};
    const mockAppConfig = {};

    (loadConfig as jest.Mock).mockReturnValue(mockServerConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(mockAppConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      serverConfig: {},
      appConfig: {},
    });
  });

  it("should handle complex configuration object", async () => {
    const mockServerConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
      llamaServerPath: "/path/to/llama-server",
      advanced: {
        ctx_size: 8192,
        batch_size: 512,
        threads: 4,
        gpu_layers: 35,
      },
      logging: {
        level: "info",
        file: "application.log",
      },
    };

    const mockAppConfig = {
      theme: "dark",
      language: "en",
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

  it("should handle loadConfig returning undefined", async () => {
    (loadConfig as jest.Mock).mockReturnValue(undefined);
    (loadAppConfig as jest.Mock).mockReturnValue(undefined);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      serverConfig: undefined,
      appConfig: undefined,
    });
  });
});

describe("POST /api/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save configuration successfully", async () => {
    const requestData = {
      serverConfig: {
        host: "localhost",
        port: 8134,
        modelsPath: "/models",
      },
      appConfig: {
        theme: "dark",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (saveConfig as jest.Mock).mockImplementation(() => {});
    (saveAppConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(requestData.serverConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(requestData.appConfig);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
      serverConfig: requestData.serverConfig,
      appConfig: requestData.appConfig,
    });
    expect(saveConfig).toHaveBeenCalledWith(requestData.serverConfig);
    expect(saveAppConfig).toHaveBeenCalledWith(requestData.appConfig);
  });

  it("should save configuration with additional properties", async () => {
    const requestData = {
      serverConfig: {
        host: "custom-host",
        port: 9999,
        modelsPath: "/custom/models",
        ctx_size: 16384,
        batch_size: 1024,
      },
      appConfig: {
        theme: "light",
        language: "fr",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (saveConfig as jest.Mock).mockImplementation(() => {});
    (saveAppConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(requestData.serverConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(requestData.appConfig);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Configuration saved successfully");
    expect(json.serverConfig).toEqual(requestData.serverConfig);
    expect(json.appConfig).toEqual(requestData.appConfig);
  });

  it("should return 500 error when saveConfig throws", async () => {
    const requestData = {
      serverConfig: {
        host: "localhost",
        port: 8134,
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
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

  it("should handle invalid JSON in request body", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
      details: "Invalid JSON",
    });
  });

  it("should handle empty configuration object", async () => {
    const requestData = {
      serverConfig: {},
      appConfig: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (saveConfig as jest.Mock).mockImplementation(() => {});
    (saveAppConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue({});
    (loadAppConfig as jest.Mock).mockReturnValue({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Configuration saved successfully");
    expect(json.serverConfig).toEqual({});
    expect(json.appConfig).toEqual({});
  });

  it("should handle configuration with special characters", async () => {
    const requestData = {
      serverConfig: {
        host: "localhost",
        port: 8134,
        modelsPath: "/path/with spaces/model",
        description: "Test configuration with special chars: !@#$%^&*()",
      },
      appConfig: {
        theme: "dark",
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestData),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: requestData,
    });

    (saveConfig as jest.Mock).mockImplementation(() => {});
    (saveAppConfig as jest.Mock).mockImplementation(() => {});
    (loadConfig as jest.Mock).mockReturnValue(requestData.serverConfig);
    (loadAppConfig as jest.Mock).mockReturnValue(requestData.appConfig);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.serverConfig).toEqual(requestData.serverConfig);
    expect(json.appConfig).toEqual(requestData.appConfig);
  });

  it("should handle request without json method", async () => {
    const mockRequest = {} as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
      details: "request.json is not a function",
    });
  });

  it("should handle validation failure", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid serverConfig format"],
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid request body");
    expect(json.details).toEqual(["Invalid serverConfig format"]);
  });
});