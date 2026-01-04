import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/models/[name]/analyze/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/database");
jest.mock("@/server/services/fit-params-service");

export const createMockRequest = () => ({} as unknown as NextRequest);

export const createMockModel = (id: number, name: string, path: string) => ({
  id,
  name,
  model_path: path,
});

export const createMockFitParams = (ctx: number, gpu: number) => ({
  id: 1,
  model_id: 1,
  recommended_ctx_size: ctx,
  recommended_gpu_layers: gpu,
});

export const createMockAnalysisResult = () => ({
  success: true,
  recommended_ctx_size: 4096,
  recommended_gpu_layers: 35,
  recommended_tensor_split: null,
  metadata: {
    file_size_bytes: 4000000000,
    quantization_type: "q4_k_m",
    parameter_count: 7000000000,
    architecture: "llama",
    context_window: 4096,
  },
  projected_cpu_memory_mb: 1000,
  projected_gpu_memory_mb: 8000,
  raw_output: "Analysis output",
  error: null,
});

export const setupDatabaseMocks = () => {
  const { initDatabase, getModels, getModelFitParams, saveModelFitParams } = jest.mocked(
    require("@/lib/database")
  );

  initDatabase.mockImplementation(() => {});
  getModels.mockReturnValue([]);
  getModelFitParams.mockReturnValue(null);
  saveModelFitParams.mockReturnValue(1);

  return { initDatabase, getModels, getModelFitParams, saveModelFitParams };
};
