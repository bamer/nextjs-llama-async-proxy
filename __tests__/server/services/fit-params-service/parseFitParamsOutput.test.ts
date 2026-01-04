import { parseFitParamsOutput } from "@/server/services/fit-params-service";

describe("FitParamsService - parseFitParamsOutput", () => {
  it("parses basic fit-params output correctly", () => {
    const output = `
Recommended parameters:
-c 4096
-ngl 35
-ts 0.5,0.5
cpu memory: 2.1 GB
gpu memory: 1.8 GB
`;

    const result = parseFitParamsOutput(output);

    expect(result).toEqual({
      recommended_ctx_size: 4096,
      recommended_gpu_layers: 35,
      recommended_tensor_split: "0.5,0.5",
      projected_cpu_memory_mb: 2150.4,
      projected_gpu_memory_mb: 1843.2,
      success: true,
      error: null,
      raw_output: output,
    });
  });

  it("handles output with MB instead of GB", () => {
    const output = `
cpu memory: 2048 MB
gpu memory: 1024 MB
`;

    const result = parseFitParamsOutput(output);

    expect(result.projected_cpu_memory_mb).toBe(2048);
    expect(result.projected_gpu_memory_mb).toBe(1024);
  });

  it("handles missing values gracefully", () => {
    const output = "Some random output without parameters";

    const result = parseFitParamsOutput(output);

    expect(result.recommended_ctx_size).toBeNull();
    expect(result.recommended_gpu_layers).toBeNull();
    expect(result.recommended_tensor_split).toBeNull();
    expect(result.projected_cpu_memory_mb).toBeNull();
    expect(result.projected_gpu_memory_mb).toBeNull();
    expect(result.success).toBe(true);
  });

  it("parses partial output correctly", () => {
    const output = `
-c 2048
cpu memory: 1.5 GB
`;

    const result = parseFitParamsOutput(output);

    expect(result.recommended_ctx_size).toBe(2048);
    expect(result.recommended_gpu_layers).toBeNull();
    expect(result.projected_cpu_memory_mb).toBe(1536);
  });
});
