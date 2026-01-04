import { POST } from "@/app/api/models/[name]/start/route";
import {
  createMockLlamaService,
  createMockRegistry,
  createMockRequest,
} from "./models-name-start.test-utils";

describe("POST /api/models/:name/start - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 400 when model name is missing", async () => {
    const response = await POST(
      {} as unknown as Parameters<typeof POST>[0],
      {
        params: Promise.resolve({ name: "" }),
      }
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      error: "Model name is required",
    });
  });

  it("should return 400 when validation fails", async () => {
    const mockRequest = createMockRequest({ invalid: "data" });

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: false,
      errors: ["Invalid request body"],
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      error: "Invalid request body",
      details: ["Invalid request body"],
    });
  });

  it("should return 503 when llamaService is not initialized", async () => {
    const mockRegistry = createMockRegistry(null);

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toMatchObject({
      error: "Llama service not initialized",
    });
  });

  it("should return 503 when llama-server is not ready", async () => {
    const mockLlamaService = createMockLlamaService("loading", []);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toMatchObject({
      error: "Llama server is not ready (status: loading)",
    });
  });

  it("should return 409 when max concurrent models reached", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { name: "model1", status: "running" },
      { name: "model2", status: "loaded" },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const { loadAppConfig } = require("@/lib/server-config");
    loadAppConfig.mockReturnValue({ maxConcurrentModels: 1 });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json).toMatchObject({
      error: expect.stringContaining("Maximum concurrent models"),
    });
  });

  it("should return 404 when model not found", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "model1", name: "model1" },
      { id: "model2", name: "model2" },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "unknown" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "unknown-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toMatchObject({
      error: "Model not found",
      model: "unknown-model",
    });
  });

  it("should return 503 when llama-server connection fails", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "llama-2-7b", name: "llama-2-7b", available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue(null);

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toMatchObject({
      error: expect.stringContaining("Failed to connect to llama-server"),
    });
  });

  it("should return error when llama-server returns non-OK status", async () => {
    const mockLlamaService = createMockLlamaService("ready", [
      { id: "llama-2-7b", name: "llama-2-7b", available: true },
    ]);

    const mockRegistry = createMockRegistry(mockLlamaService);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
    });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toMatchObject({
      error: expect.stringContaining("Failed to load model"),
    });
  });
});
