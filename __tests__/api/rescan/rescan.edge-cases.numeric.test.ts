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

describe("POST /api/llama-server/rescan - Numeric Edge Cases", () => {
  beforeEach(() => {
    resetGlobalMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle invalid negative port number", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      port: -1,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBe(-1);
  });

  it("should handle port larger than max range", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      port: 999999,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBe(999999);
  });

  it("should handle port as string value", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      port: "8080",
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(typeof json.config.port).toBe("number");
    expect(json.config.port).toBe(8080);
  });

  it("should handle negative values for numeric config options", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      ctx_size: -100,
      batch_size: -50,
      threads: -10,
      gpu_layers: -5,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.ctx_size).toBe(-100);
    expect(json.config.batch_size).toBe(-50);
    expect(json.config.threads).toBe(-10);
    expect(json.config.gpu_layers).toBe(-5);
  });

  it("should handle extremely large numeric config values", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      ctx_size: Number.MAX_SAFE_INTEGER,
      batch_size: Number.MAX_SAFE_INTEGER,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.ctx_size).toBe(Number.MAX_SAFE_INTEGER);
  });
});
