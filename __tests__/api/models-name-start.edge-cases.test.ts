import { POST } from "@/app/api/models/[name]/start/route";
import {
  createMockLlamaService,
  createMockRegistry,
  createMockRequest,
} from "./models-name-start.test-utils";

describe("POST /api/models/:name/start - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle fetch throwing an error", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "test-model", name: "test-model", available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test-model" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toMatchObject({
      error: expect.stringContaining("Failed to load model"),
    });
  });

  it("should handle concurrent start requests", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "test", name: "test", available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const [response1, response2] = await Promise.all([
      POST(mockRequest, { params: Promise.resolve({ name: "test" }) }),
      POST(mockRequest, { params: Promise.resolve({ name: "test" }) }),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it("should handle special characters in model name", async () => {
    const modelName = "llama-2-7b-日本語-中文";

    const mockLlamaService = createMockLlamaService("ready", [
      { id: modelName, name: modelName, available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ model: modelName }),
    });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: modelName } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: modelName }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(modelName);
  });

  it("should handle extremely long model names", async () => {
    const longName = "a".repeat(1000);

    const mockLlamaService = createMockLlamaService("ready", [
      { id: longName, name: longName, available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ model: longName }),
    });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: longName } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: longName }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  it("should handle unicode characters in request body", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "test", name: "test", available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const mockRequest = createMockRequest({ note: "🚀 Launch emoji 🎉" });

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: true,
      data: { model: "test", note: "🚀 Launch emoji 🎉" },
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test" }),
    });

    expect(response.status).toBe(200);
  });

  it("should handle very large request body", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "test", name: "test", available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const largeData = { data: "x".repeat(1_000_000) };
    const mockRequest = createMockRequest(largeData);

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test", ...largeData } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test" }),
    });

    expect(response.status).toBe(200);
  });
});
