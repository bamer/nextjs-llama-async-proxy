import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";
import { createMinimalConfig, buildArgs } from "./test-utils";

describe("ArgumentBuilder - Context and Batch Size", () => {
  it("should include context size argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      ctx_size: 2048,
    };

    const args = buildArgs(config);

    expect(args).toContain("-c");
    expect(args).toContain("2048");
  });

  it("should not include context size if undefined", () => {
    const config: LlamaServerConfig = createMinimalConfig();

    const args = buildArgs(config);

    expect(args).not.toContain("-c");
  });

  it("should include batch size argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      batch_size: 512,
    };

    const args = buildArgs(config);

    expect(args).toContain("-b");
    expect(args).toContain("512");
  });

  it("should include ubatch size argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      ubatch_size: 512,
    };

    const args = buildArgs(config);

    expect(args).toContain("--ubatch-size");
    expect(args).toContain("512");
  });
});

describe("ArgumentBuilder - Threads Configuration", () => {
  it("should include threads argument when not -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      threads: 4,
    };

    const args = buildArgs(config);

    expect(args).toContain("-t");
    expect(args).toContain("4");
  });

  it("should not include threads argument when -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      threads: -1,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("-t");
  });

  it("should include threads-batch argument when not -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      threads_batch: 4,
    };

    const args = buildArgs(config);

    expect(args).toContain("--threads-batch");
    expect(args).toContain("4");
  });

  it("should not include threads-batch argument when -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      threads_batch: -1,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("--threads-batch");
  });
});
