import { NextRequest } from "next/server";
import { POST } from "@/app/api/models/[name]/start/route";

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
  })),
}));

jest.mock("@/lib/server-config", () => ({
  loadAppConfig: jest.fn(() => ({ maxConcurrentModels: 1 })),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn(),
}));

export const createMockLlamaService = (status: string = "ready", models: unknown[] = []) => ({
  getState: jest.fn().mockReturnValue({
    status,
    models,
  }),
});

export const createMockRegistry = (llamaService: unknown | null = null) => ({
  get: jest.fn().mockReturnValue(llamaService),
});

export const createMockRequest = (data: unknown = {}) =>
  ({
    json: jest.fn().mockResolvedValue(data),
  }) as unknown as NextRequest;

export const createMockFetchResponse = (ok: boolean, status: number, data: unknown) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
});

export const setupSuccessScenario = (modelId: string) => {
  const mockLlamaService = createMockLlamaService("ready", [
    {
      id: modelId,
      name: modelId,
      available: true,
    },
  ]);

  const mockRegistry = createMockRegistry(mockLlamaService);
  (global as unknown as { registry: unknown }).registry = mockRegistry;

  (global.fetch as jest.Mock).mockResolvedValue(
    createMockFetchResponse(true, 200, { model: modelId })
  );

  const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
  validateRequestBody.mockReturnValue({ success: true, data: { model: modelId } });

  return { mockLlamaService, mockRegistry };
};

export const setupErrorScenario = (modelName: string, errorDetails: unknown) => {
  const mockRequest = createMockRequest(errorDetails);
  const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
  validateRequestBody.mockReturnValue({
    success: false,
    errors: ["Invalid request body"],
  });
  return mockRequest;
};
