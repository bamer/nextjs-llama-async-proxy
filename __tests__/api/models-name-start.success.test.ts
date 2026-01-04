import { POST } from "@/app/api/models/[name]/start/route";
import {
  setupSuccessScenario,
  createMockRequest,
} from "./models-name-start.test-utils";

describe("POST /api/models/:name/start - Success Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should start a model successfully", async () => {
    setupSuccessScenario("llama-2-7b");

    const mockRequest = createMockRequest({});

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      model: "llama-2-7b",
      status: "loaded",
    });
  });

  it("should start model with template", async () => {
    setupSuccessScenario("mistral-7b");

    const mockRequest = createMockRequest({ template: "chat-template" });

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: true,
      data: { model: "mistral-7b", template: "chat-template" },
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "mistral-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe("mistral-7b");
  });

  it("should find model by id when name doesn't match", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "llama-2-7b", name: "LLaMA-2-7B", available: true },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ model: "LLaMA-2-7B" }),
    });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  it("should use default maxConcurrentModels when appConfig is missing", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "test-model", name: "test-model", available: true },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const { loadAppConfig } = require("@/lib/server-config");
    loadAppConfig.mockReturnValue({});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const mockRequest = createMockRequest({});

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: true,
      data: { model: "test-model" },
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });

    expect(response.status).toBe(200);
  });
});
