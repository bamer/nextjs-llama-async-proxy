import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/model-templates/route";
import { promises as fs } from "fs";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("@/lib/validation-utils");
jest.mock("@/lib/model-templates-config");
jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

export const createMockRequest = (data: unknown) =>
  ({
    json: jest.fn().mockResolvedValue(data),
  }) as unknown as NextRequest;

export const createMockConfig = () => ({
  model_templates: {
    "llama-2-7b": {
      ctx_size: 4096,
      gpu_layers: 35,
    },
  },
  default_model: "llama-2-7b",
});
