import { GET, POST } from "../../app/api/models/[name]/analyze/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/database", () => ({
  initDatabase: jest.fn(),
  getModels: jest.fn(),
  getModelFitParams: jest.fn(),
  saveModelFitParams: jest.fn(),
}));

jest.mock("@/server/services/fit-params-service", () => ({
  analyzeModel: jest.fn(),
}));

describe("GET /api/models/:name/analyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return fit-params data when model exists", async () => {
    const mockModel = {
      id: "model-1",
      name: "test-model",
      type: "llama",
      size: 4096000000,
      modified_at: 1703568000,
      model_path: "/path/to/model.gguf",
    };

    const mockFitParams = {
      id: 1,
      model_id: "model-1",
      recommended_ctx_size: 2048,
      recommended_gpu_layers: 20,
      fit_params_analyzed_at: Date.now(),
    };

    const { getModels, getModelFitParams } = require("@/lib/database");
    getModels.mockReturnValue([mockModel]);
    getModelFitParams.mockReturnValue(mockFitParams);

    const response = await GET(null as any, { params: Promise.resolve({ name: "test-model" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model).toEqual(mockModel);
    expect(json.data.fitParams).toEqual(mockFitParams);
  });

  it("should return 400 when model name is missing", async () => {
    const response = await GET(null as any, { params: Promise.resolve({ name: "" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  it("should return 404 when model is not found", async () => {
    const { getModels } = require("@/lib/database");
    getModels.mockReturnValue([]);

    const response = await GET(null as any, { params: Promise.resolve({ name: "nonexistent" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });
});

describe("POST /api/models/:name/analyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should run analysis and save fit-params when model exists", async () => {
    const mockModel = {
      id: "model-1",
      name: "test-model",
      type: "llama",
      size: 4096000000,
      modified_at: 1703568000,
      model_path: "/path/to/model.gguf",
    };

    const mockAnalysisResult = {
      success: true,
      recommended_ctx_size: 2048,
      recommended_gpu_layers: 20,
      recommended_tensor_split: null,
      metadata: {
        file_size_bytes: 4096000000,
        quantization_type: "Q4_0",
        parameter_count: 7000000000,
        architecture: "llama",
        context_window: 4096,
      },
      projected_cpu_memory_mb: 1024,
      projected_gpu_memory_mb: 2048,
      raw_output: "analysis output",
    };

    const { getModels, saveModelFitParams } = require("@/lib/database");
    const { analyzeModel } = require("@/server/services/fit-params-service");

    getModels.mockReturnValue([mockModel]);
    analyzeModel.mockResolvedValue(mockAnalysisResult);
    saveModelFitParams.mockReturnValue(1);

    const response = await POST(null as any, { params: Promise.resolve({ name: "test-model" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model).toEqual(mockModel);
    expect(json.data.fitParams.recommended_ctx_size).toBe(2048);
    expect(json.data.fitParams.recommended_gpu_layers).toBe(20);
    expect(analyzeModel).toHaveBeenCalledWith("/path/to/model.gguf");
  });

  it("should return 400 when model name is missing", async () => {
    const response = await POST(null as any, { params: Promise.resolve({ name: "" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  it("should return 404 when model is not found", async () => {
    const { getModels } = require("@/lib/database");
    getModels.mockReturnValue([]);

    const response = await POST(null as any, { params: Promise.resolve({ name: "nonexistent" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  it("should return 400 when model has no path", async () => {
    const mockModel = {
      id: "model-1",
      name: "test-model",
      type: "llama",
      size: 4096000000,
      modified_at: 1703568000,
      // model_path is missing
    };

    const { getModels } = require("@/lib/database");
    getModels.mockReturnValue([mockModel]);

    const response = await POST(null as any, { params: Promise.resolve({ name: "test-model" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NO_MODEL_PATH");
  });
});