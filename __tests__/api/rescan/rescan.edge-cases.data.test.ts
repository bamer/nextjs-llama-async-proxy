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

describe("POST /api/llama-server/rescan - Data Edge Cases", () => {
  beforeEach(() => {
    resetGlobalMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle concurrent rescan requests", async () => {
    setupMockLlamaIntegration();

    const mockRequest = createMockRequest({});

    const responses = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should handle paths with special characters", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      modelsPath: "/path/with spaces & special@chars#test",
      llamaServerPath: "/another/path with-特殊.chars",
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.basePath).toContain("spaces");
  });

  it("should handle port as NaN", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      port: "not-a-number",
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBeNaN();
  });

  it("should handle rescan with conflicting config options", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      host: "localhost",
      port: 8134,
      ctx_size: 16384,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  it("should use environment variables even if invalid", async () => {
    process.env.LLAMA_SERVER_PORT = "invalid-port";

    setupMockLlamaIntegration();

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.config.port).toBeNaN();

    delete process.env.LLAMA_SERVER_PORT;
  });

  it("should handle very long config paths", async () => {
    setupMockLlamaIntegration();

    const longPath = "/a".repeat(5000);
    const mockBody = {
      modelsPath: longPath,
      llamaServerPath: longPath,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  it("should handle config with null values", async () => {
    setupMockLlamaIntegration();

    const mockBody = {
      host: null,
      port: null,
      modelsPath: null,
      ctx_size: null,
    };

    const mockRequest = createMockRequest(mockBody);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });
});
