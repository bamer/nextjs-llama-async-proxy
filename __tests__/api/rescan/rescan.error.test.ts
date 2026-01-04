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
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn((_schema, data) => ({ success: true, data })),
}));

describe("POST /api/llama-server/rescan - Error Handling", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetGlobalMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 503 error when llamaIntegration is not initialized", async () => {
    (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
      undefined;

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "Llama service not initialized",
    });
  });

  it("should handle stop() failure gracefully", async () => {
    setupMockLlamaIntegration({
      stopShouldFail: true,
    });

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to rescan models",
    });
  });

  it("should handle initialize() failure gracefully", async () => {
    const mockLlamaIntegration = setupMockLlamaIntegration({
      initializeShouldFail: true,
    });

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to rescan models",
    });
    expect(mockLlamaIntegration.stop).toHaveBeenCalled();
    expect(mockLlamaIntegration.initialize).toHaveBeenCalled();
  });

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

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to rescan models");
  });
});
