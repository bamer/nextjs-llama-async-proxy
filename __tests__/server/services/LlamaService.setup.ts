import { spawn, ChildProcess } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  LlamaService,
  LlamaServerConfig,
} from "@/server/services/LlamaService";

// Mock dependencies
jest.mock("child_process");
jest.mock("axios");
jest.mock("fs");
jest.mock("path");

export const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
export const mockedAxios = axios as jest.Mocked<typeof axios>;
export const mockedFs = fs as jest.Mocked<typeof fs>;
export const mockedPath = path as jest.Mocked<typeof path>;

export const mockConfig: LlamaServerConfig = {
  host: "localhost",
  port: 8080,
  modelPath: "/path/to/model.gguf",
  basePath: "/path/to/models",
  serverPath: "/path/to/llama-server",
  ctx_size: 2048,
  batch_size: 512,
  threads: 4,
  gpu_layers: 20,
  temperature: 0.7,
  verbose: true,
};

export function createMockStdout(): any {
  return {
    on: jest.fn(),
  };
}

export function createMockStderr(): any {
  return {
    on: jest.fn(),
  };
}

export function createMockProcess(): ChildProcess {
  const mockStdout = createMockStdout();
  const mockStderr = createMockStderr();

  return {
    pid: 12345,
    kill: jest.fn(),
    on: jest.fn(),
    stdout: mockStdout,
    stderr: mockStderr,
    unref: jest.fn(),
  } as any;
}

export function setupCommonMocks(): void {
  mockedPath.join.mockImplementation((...args) => args.join("/"));
  mockedPath.resolve.mockImplementation((...args) => args.join("/"));
  mockedFs.existsSync.mockReturnValue(true);
}

export function setupMockedAxios(): any {
  mockedAxios.create.mockReturnValue({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    defaults: { timeout: 5000 },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  } as any);
}
