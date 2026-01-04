import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";
import { createMinimalConfig, buildArgs } from "./test-utils";

describe("ArgumentBuilder - GPU Configuration", () => {
  it("should include gpu layers argument when not -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      gpu_layers: 20,
    };

    const args = buildArgs(config);

    expect(args).toContain("-ngl");
    expect(args).toContain("20");
  });

  it("should not include gpu layers argument when -1", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      gpu_layers: -1,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("-ngl");
  });

  it("should include main gpu argument when not 0", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      main_gpu: 1,
    };

    const args = buildArgs(config);

    expect(args).toContain("-mg");
    expect(args).toContain("1");
  });

  it("should not include main gpu argument when 0", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      main_gpu: 0,
    };

    const args = buildArgs(config);

    expect(args).not.toContain("-mg");
  });

  it("should include -fa flag when flash_attn is on", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      flash_attn: "on",
    };

    const args = buildArgs(config);

    expect(args).toContain("-fa");
  });

  it("should include --no-flash-attn flag when flash_attn is off", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      flash_attn: "off",
    };

    const args = buildArgs(config);

    expect(args).toContain("--no-flash-attn");
  });

  it("should not include flash attention flag when auto", () => {
    const config: LlamaServerConfig = {
      ...createMinimalConfig(),
      flash_attn: "auto",
    };

    const args = buildArgs(config);

    expect(args).not.toContain("-fa");
    expect(args).not.toContain("--no-flash-attn");
  });
});
