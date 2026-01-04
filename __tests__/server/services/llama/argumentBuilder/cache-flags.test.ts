import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";
import { createMinimalConfig, buildArgs } from "./test-utils";

describe("ArgumentBuilder - Cache and Flags", () => {
  it("should include cache type k argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      cache_type_k: "f16",
    };

    const args = buildArgs(config);

    expect(args).toContain("--cache-type-k");
    expect(args).toContain("f16");
  });

  it("should include cache type v argument", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      cache_type_v: "f16",
    };

    const args = buildArgs(config);

    expect(args).toContain("--cache-type-v");
    expect(args).toContain("f16");
  });

  it("should include verbose flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      verbose: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--verbose");
  });

  it("should include penalize_nl flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      penalize_nl: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--penalize-nl");
  });

  it("should include ignore_eos flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      ignore_eos: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--ignore-eos");
  });

  it("should include mlock flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      mlock: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--mlock");
  });

  it("should include numa flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      numa: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--numa");
  });

  it("should include memory_mapped flag when true", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      memory_mapped: true,
    };

    const args = buildArgs(config);

    expect(args).toContain("--memory-mapped");
  });

  it("should include --no-mmap flag when use_mmap is false", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      use_mmap: false,
    };

    const args = buildArgs(config);

    expect(args).toContain("--no-mmap");
  });
});
