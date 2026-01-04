/**
 * Shared test utilities for fit-params-service tests
 */

import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

const mockedExec = require("child_process").exec as jest.MockedFunction<any>;
const mockedFs = require("fs") as jest.Mocked<typeof fs>;
const mockedPath = require("path") as jest.Mocked<typeof path>;

export function setupDefaultMocks(): void {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.statSync.mockReturnValue({
    size: 1024 * 1024 * 1024,
    mtimeMs: Date.now(),
  } as unknown);

  mockedExec.mockImplementation(() =>
    Promise.resolve({
      stdout: "-c 4096\n-ngl 35\ncpu memory: 2.1 GB\ngpu memory: 1.8 GB",
      stderr: "",
    })
  );

  mockedPath.basename.mockImplementation((p) => p.split("/").pop() || "");
}

export function mockFileNotExists(): void {
  mockedFs.existsSync.mockReturnValue(false);
}

export function mockExecFailure(error: string): void {
  mockedExec.mockImplementation(() => Promise.reject(new Error(error)));
}

export function mockExecSuccess(output: string): void {
  mockedExec.mockImplementation(() =>
    Promise.resolve({ stdout: output, stderr: "" })
  );
}
