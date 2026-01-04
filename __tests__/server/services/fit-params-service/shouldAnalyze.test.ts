import { shouldAnalyze } from "@/server/services/fit-params-service";
import * as fs from "fs";
import { setupDefaultMocks } from "./test-utils";

const mockedFs = require("fs") as jest.Mocked<typeof fs>;

describe("FitParamsService - shouldAnalyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it("returns true for never analyzed model", () => {
    const result = shouldAnalyze(null, "/path/to/model.gguf");

    expect(result).toBe(true);
  });

  it("returns true when model file is newer than last analysis", () => {
    const lastAnalyzed = Date.now() - 1000;
    mockedFs.statSync.mockReturnValue({
      mtimeMs: Date.now(),
    } as unknown);

    const result = shouldAnalyze(lastAnalyzed, "/path/to/model.gguf");

    expect(result).toBe(true);
  });

  it("returns false when model file is older than last analysis", () => {
    const lastAnalyzed = Date.now();
    mockedFs.statSync.mockReturnValue({
      mtimeMs: Date.now() - 1000,
    } as unknown);

    const result = shouldAnalyze(lastAnalyzed, "/path/to/model.gguf");

    expect(result).toBe(false);
  });

  it("returns false when model path is null", () => {
    const result = shouldAnalyze(Date.now(), null);

    expect(result).toBe(false);
  });

  it("returns false when model file doesn't exist", () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = shouldAnalyze(Date.now(), "/path/to/nonexistent.gguf");

    expect(result).toBe(false);
  });
});
