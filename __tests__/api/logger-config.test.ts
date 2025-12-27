import { POST } from "../../app/api/logger/config/route";
import { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

describe("POST /api/logger/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive test: Successfully receive logger configuration
  it("should receive logger configuration successfully", async () => {
    const mockConfig = {
      level: "info",
      file: "application.log",
      maxSize: "10m",
      maxFiles: 5,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      message: "Logger config received (client-side only)",
      note: "Server-side logging is configured in server.js",
    });
    expect(console.log).toHaveBeenCalledWith(
      "[Logger API] Logger config received (not applied server-side):",
      mockConfig
    );
  });

  // Positive test: Handle minimal configuration
  it("should handle minimal configuration", async () => {
    const mockConfig = {
      level: "debug",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Logger config received (client-side only)");
  });

  // Positive test: Handle complex configuration
  it("should handle complex configuration with multiple properties", async () => {
    const mockConfig = {
      level: "verbose",
      file: "application.log",
      errorFile: "errors.log",
      maxSize: "20m",
      maxFiles: 10,
      datePattern: "YYYY-MM-DD",
      format: "json",
      transports: ["console", "file"],
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.note).toContain("Server-side logging is configured in server.js");
  });

  // Negative test: Return 500 when request JSON parsing fails
  it("should return 500 error when request JSON parsing fails", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to process logger config",
    });
  });

  // Positive test: Handle empty configuration object
  it("should handle empty configuration object", async () => {
    const mockConfig = {};

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Logger config received (client-side only)");
  });

  // Positive test: Handle configuration with special characters
  it("should handle configuration with special characters", async () => {
    const mockConfig = {
      file: "/path/with spaces/log file.log",
      prefix: "prefix_with-special!@#chars",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Positive test: Log received configuration
  it("should log received configuration", async () => {
    const mockConfig = {
      level: "warn",
      file: "warnings.log",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const logSpy = jest.spyOn(console, "log");

    await POST(mockRequest);

    expect(logSpy).toHaveBeenCalledWith(
      "[Logger API] Logger config received (not applied server-side):",
      mockConfig
    );
  });

  // Negative test: Handle null configuration
  it("should handle null configuration", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue(null),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Logger config received (client-side only)");
  });

  // Positive test: Handle configuration with numeric values
  it("should handle configuration with numeric values", async () => {
    const mockConfig = {
      level: "info",
      maxFiles: 7,
      maxSizeBytes: 10485760,
      retentionDays: 30,
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockConfig),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });
});
