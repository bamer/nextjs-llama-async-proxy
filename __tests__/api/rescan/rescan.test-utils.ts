import { NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";

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

export interface MockLogger {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
}

export interface MockLlamaIntegration {
  stop: jest.Mock;
  initialize: jest.Mock;
}

export interface RescanConfigBody {
  host?: string | null;
  port?: number | string | null;
  modelsPath?: string | null;
  llamaServerPath?: string | null;
  ctx_size?: number | null;
  batch_size?: number | null;
  threads?: number | null;
  gpu_layers?: number | null;
}

export const createMockLogger = (): MockLogger => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});

export const createMockLlamaIntegration = (
  options: {
    stopShouldFail?: boolean;
    initializeShouldFail?: boolean;
  } = {}
): MockLlamaIntegration => {
  const mock = {
    stop: jest.fn(),
    initialize: jest.fn(),
  };

  if (options.stopShouldFail) {
    mock.stop.mockRejectedValue(new Error("Stop failed"));
  } else {
    mock.stop.mockResolvedValue(undefined);
  }

  if (options.initializeShouldFail) {
    mock.initialize.mockRejectedValue(new Error("Initialize failed"));
  } else {
    mock.initialize.mockResolvedValue(undefined);
  }

  return mock;
};

export const setupMockLogger = (): MockLogger => {
  const logger = createMockLogger();
  (getLogger as jest.Mock).mockReturnValue(logger);
  return logger;
};

export const setupMockLlamaIntegration = (
  options: {
    stopShouldFail?: boolean;
    initializeShouldFail?: boolean;
  } = {}
): MockLlamaIntegration => {
  const mock = createMockLlamaIntegration(options);
  (global as unknown as { llamaIntegration: unknown }).llamaIntegration =
    mock;
  return mock;
};

export const createMockRequest = (
  body: RescanConfigBody
): NextRequest => {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

export const createMockRequestWithJsonError = (): NextRequest => {
  return {
    json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
  } as unknown as NextRequest;
};

export const resetGlobalMocks = (): void => {
  jest.clearAllMocks();
};

export const getDefaultExpectedConfig = () => ({
  host: "localhost",
  port: 8134,
  basePath: "/models",
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
});
