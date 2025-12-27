import { GET, POST } from "../../app/api/config/route";
import { NextRequest } from "next/server";
import { loadConfig, saveConfig } from "@/lib/server-config";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/server-config");

describe("GET /api/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully retrieve configuration
  it("should return configuration successfully", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
      llamaServerPath: "/path/to/llama-server",
    };

    (loadConfig as jest.Mock).mockReturnValue(mockConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockConfig);
    expect(loadConfig).toHaveBeenCalledTimes(1);
  });

  // Negative test: Return 500 when loadConfig fails
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

  // Positive test: Handle empty configuration
  it("should handle empty configuration", async () => {
    const mockConfig = {};

    (loadConfig as jest.Mock).mockReturnValue(mockConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({});
  });

  // Positive test: Handle complex configuration object
  it("should handle complex configuration object", async () => {
    const mockConfig = {
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

    (loadConfig as jest.Mock).mockReturnValue(mockConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockConfig);
  });
});

describe("POST /api/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully save configuration
  it("should save configuration successfully", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Configuration saved successfully",
      config: mockConfig,
    });
    expect(saveConfig).toHaveBeenCalledWith(mockConfig);
  });

  // Positive test: Save configuration with additional properties
  it("should save configuration with additional properties", async () => {
    const mockConfig = {
      host: "custom-host",
      port: 9999,
      modelsPath: "/custom/models",
      ctx_size: 16384,
      batch_size: 1024,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Configuration saved successfully");
    expect(json.config).toEqual(mockConfig);
  });

  // Negative test: Return 500 when saveConfig fails
  it("should return 500 error when saveConfig throws", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to save config");
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
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

  // Positive test: Handle empty configuration object
  it("should handle empty configuration object", async () => {
    const mockConfig = {};

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Configuration saved successfully");
    expect(json.config).toEqual({});
  });

  // Positive test: Handle configuration with special characters
  it("should handle configuration with special characters", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/path/with spaces/model",
      description: "Test configuration with special chars: !@#$%^&*()",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config).toEqual(mockConfig);
  });

  // Edge case: Handle very large configuration object
  it("should handle very large configuration object", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      // Create a large config with many properties
      ...Array.from({ length: 100 }, (_, i) => ({
        [`prop_${i}`]: `value_${i}`.repeat(10),
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config).toEqual(mockConfig);
  });

  // Edge case: Handle configuration with invalid data types
  it("should handle configuration with mixed data types", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      isValid: true,
      count: 42,
      ratio: 3.14,
      nested: { a: 1, b: "two", c: true },
      array: [1, 2, 3, "four"],
      nullValue: null,
      undefinedValue: undefined,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle configuration with unicode characters
  it("should handle configuration with unicode characters", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      modelsPath: "/models/日本語",
      description: "Test with unicode: ñ, é, 中文, العربية",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Test concurrent requests to save config
  it("should handle concurrent save requests", async () => {
    const mockConfig1 = { host: "localhost", port: 8134 };
    const mockConfig2 = { host: "localhost", port: 8135 };

    const mockRequest1 = {
      json: jest.fn().mockResolvedValue(mockConfig1),
    } as unknown as NextRequest;

    const mockRequest2 = {
      json: jest.fn().mockResolvedValue(mockConfig2),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const [response1, response2] = await Promise.all([
      POST(mockRequest1),
      POST(mockRequest2),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  // Edge case: Handle configuration with extremely long string values
  it("should handle configuration with extremely long strings", async () => {
    const longString = "a".repeat(10000);
    const mockConfig = {
      host: "localhost",
      port: 8134,
      longValue: longString,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle configuration with deeply nested objects
  it("should handle deeply nested configuration objects", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: "deep",
              },
            },
          },
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle response with timestamp-like properties
  it("should handle configuration with timestamp fields", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
      lastModified: 1704067200000,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: GET request when loadConfig returns undefined
  it("should handle loadConfig returning undefined", async () => {
    (loadConfig as jest.Mock).mockReturnValue(undefined);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toBeUndefined();
  });

  // Edge case: POST with request that has no json method
  it("should handle request without json method", async () => {
    const mockRequest = {} as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to save config",
    });
  });

  // Edge case: Handle configuration with function-like properties
  it("should handle configuration with reserved property names", async () => {
    const mockConfig = {
      host: "localhost",
      port: 8134,
      toString: "test",
      constructor: "test2",
      prototype: "test3",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    (saveConfig as jest.Mock).mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });
});
