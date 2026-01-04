import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";
import { createMinimalConfig, buildArgs } from "./test-utils";

describe("ArgumentBuilder - Sampling Parameters", () => {
  it("should include temperature argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      temperature: 0.7,
    };

    const args = buildArgs(config);

    expect(args).toContain("--temp");
    expect(args).toContain("0.7");
  });

  it("should include top_k argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      top_k: 40,
    };

    const args = buildArgs(config);

    expect(args).toContain("--top-k");
    expect(args).toContain("40");
  });

  it("should include top_p argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      top_p: 0.9,
    };

    const args = buildArgs(config);

    expect(args).toContain("--top-p");
    expect(args).toContain("0.9");
  });

  it("should include repeat_penalty argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      repeat_penalty: 1.1,
    };

    const args = buildArgs(config);

    expect(args).toContain("--repeat-penalty");
    expect(args).toContain("1.1");
  });
});

describe("ArgumentBuilder - Generation Parameters", () => {
  it("should include n_predict argument when not -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      n_predict: 512,
    };

    const args = buildArgs(config);

    expect(args).toContain("-n");
    expect(args).toContain("512");
  });

  it("should not include n_predict argument when -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      n_predict: -1,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("-n");
  });

  it("should include seed argument when not -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      seed: 42,
    };

    const args = buildArgs(config);

    expect(args).toContain("--seed");
    expect(args).toContain("42");
  });

  it("should not include seed argument when -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      seed: -1,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("--seed");
  });

  it("should include embedding flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      embedding: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--embedding");
  });

  it("should not include embedding flag when false or undefined", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      embedding: false,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("--embedding");
  });
});
