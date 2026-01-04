import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";
import { createMinimalConfig, createFullConfig, buildArgs } from "./test-utils";

describe("ArgumentBuilder - Comprehensive Configs", () => {
  it("should include custom server args", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      serverArgs: ["--custom-flag", "custom-value", "--another-flag"],
    };

    const args = buildArgs(config);

    expect(args).toContain("--custom-flag");
    expect(args).toContain("custom-value");
    expect(args).toContain("--another-flag");
  });

  it("should build comprehensive arguments with all options", () => {
    const config = createFullConfig();

    const args = buildArgs(config);

    expect(args.length).toBeGreaterThan(0);
    expect(args).toContain("-m");
    expect(args).toContain("/path/to/model.gguf");
    expect(args).toContain("--custom");
  });

  it("should handle minimal config with only required fields", () => {
    const config = createMinimalConfig();

    const args = buildArgs(config);

    expect(args).toContain("--host");
    expect(args).toContain("localhost");
    expect(args).toContain("--port");
    expect(args).toContain("8080");
  });
});
