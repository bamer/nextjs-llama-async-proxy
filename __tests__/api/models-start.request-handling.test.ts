jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

import { POST as StartModel } from "../../app/api/models/[name]/start/route";
import {
  createMockLlamaService,
  createMockModels,
  createMockParams,
  createMockRequest,
  createMockResponse,
  setupGlobalMocks,
} from "./models-start.helpers";

describe("POST /api/models/[name]/start - Request/Response Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle request body that fails to parse", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Parameters<typeof StartModel>[0];

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle llama-server response parsing failure", async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockRejectedValue(new Error("Parse error")),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });
});
