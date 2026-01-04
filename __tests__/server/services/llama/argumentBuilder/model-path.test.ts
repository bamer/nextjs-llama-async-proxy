import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";
import { createMinimalConfig, buildArgs } from "./test-utils";

describe("ArgumentBuilder - Model Path Arguments", () => {
  it("should build arguments with model path", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      modelPath: "/path/to/model.gguf",
    };

    const args = buildArgs(config);

    expect(args).toContain("-m");
    expect(args).toContain("/path/to/model.gguf");
  });

  it("should build arguments with models directory when no model path", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      basePath: "/path/to/models",
    };

    const args = buildArgs(config);

    expect(args).toContain("--models-dir");
    expect(args).toContain("/path/to/models");
  });
});

describe("ArgumentBuilder - Server Binding Arguments", () => {
  it("should include server binding arguments", () => {
    const config: LlamaServerConfig = {
      host: "0.0.0.0",
      port: 3000,
    };

    const args = buildArgs(config);

    expect(args).toContain("--host");
    expect(args).toContain("0.0.0.0");
    expect(args).toContain("--port");
    expect(args).toContain("3000");
  });
});
