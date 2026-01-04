import { GET, POST } from "@/app/api/models/[name]/analyze/route";
import {
  createMockRequest,
  createMockModel,
  createMockAnalysisResult,
  setupDatabaseMocks,
} from "./models-analyze-route.test-utils";

describe("GET /api/models/:name/analyze - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle model name with special characters", async () => {
    const mockModel = createMockModel(1, "llama-2-7b-日本語-中文", "/models/test.gguf");

    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "llama-2-7b-日本語-中文" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  it("should handle concurrent GET requests", async () => {
    const mockModel = createMockModel(1, "test-model", "/models/test.gguf");

    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const responses = await Promise.all([
      GET(createMockRequest(), { params: Promise.resolve({ name: "test-model" }) }),
      GET(createMockRequest(), { params: Promise.resolve({ name: "test-model" }) }),
      GET(createMockRequest(), { params: Promise.resolve({ name: "test-model" }) }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });
});

describe("POST /api/models/:name/analyze - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle model with empty path", async () => {
    const mockModel = createMockModel(1, "test-model", "");

    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("NO_MODEL_PATH");
  });

  it("should handle concurrent POST requests", async () => {
    const mockModel = createMockModel(1, "test-model", "/models/test.gguf");
    const mockAnalysisResult = createMockAnalysisResult();

    const { getModels, saveModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const { analyzeModel } = jest.mocked(require("@/server/services/fit-params-service"));
    analyzeModel.mockResolvedValue(mockAnalysisResult);
    saveModelFitParams.mockReturnValue(1);

    const responses = await Promise.all([
      POST(createMockRequest(), { params: Promise.resolve({ name: "test-model" }) }),
      POST(createMockRequest(), { params: Promise.resolve({ name: "test-model" }) }),
      POST(createMockRequest(), { params: Promise.resolve({ name: "test-model" }) }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should handle model path with spaces", async () => {
    const mockModel = createMockModel(1, "test-model", "/path/with spaces/model.gguf");
    const mockAnalysisResult = createMockAnalysisResult();

    const { getModels, saveModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const { analyzeModel } = jest.mocked(require("@/server/services/fit-params-service"));
    analyzeModel.mockResolvedValue(mockAnalysisResult);
    saveModelFitParams.mockReturnValue(1);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(analyzeModel).toHaveBeenCalledWith("/path/with spaces/model.gguf");
  });

  it("should handle analysis with all null optional fields", async () => {
    const mockModel = createMockModel(1, "test-model", "/models/test.gguf");
    const mockAnalysisResult = {
      success: true,
      recommended_ctx_size: 0,
      recommended_gpu_layers: 0,
      recommended_tensor_split: null,
      metadata: {
        file_size_bytes: 0,
        quantization_type: null,
        parameter_count: 0,
        architecture: null,
        context_window: 0,
      },
      projected_cpu_memory_mb: 0,
      projected_gpu_memory_mb: 0,
      raw_output: null,
      error: null,
    };

    const { getModels, saveModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const { analyzeModel } = jest.mocked(require("@/server/services/fit-params-service"));
    analyzeModel.mockResolvedValue(mockAnalysisResult);
    saveModelFitParams.mockReturnValue(1);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fitParams.recommended_ctx_size).toBe(0);
  });
});
