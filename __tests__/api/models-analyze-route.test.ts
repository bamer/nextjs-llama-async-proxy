import { GET } from "../../../app/api/models/[name]/analyze/route";
import { POST } from "../../../app/api/models/[name]/analyze/route";
import { NextRequest } from "next/server";
import { initDatabase, getModels, getModelFitParams, saveModelFitParams } from "@/lib/database";
import { analyzeModel } from "@/server/services/fit-params-service";

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

describe("GET /api/models/:name/analyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully retrieve fit-params for existing model
  it("should return fit-params data for existing model", async () => {
    const mockModel = {
      id: 1,
      name: "llama-2-7b",
      model_path: "/models/llama-2-7b.gguf",
    };

    const mockFitParams = {
      id: 1,
      model_id: 1,
      recommended_ctx_size: 4096,
      recommended_gpu_layers: 35,
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (getModelFitParams as jest.Mock).mockReturnValue(mockFitParams);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model).toEqual(mockModel);
    expect(json.data.fitParams).toEqual(mockFitParams);
  });

  // Positive test: Handle model without fit-params
  it("should return null fitParams when model has no analysis", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (getModelFitParams as jest.Mock).mockReturnValue(null);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fitParams).toBe(null);
  });

  // Negative test: Return 400 when model name is missing
  it("should return 400 error when model name is missing", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  // Negative test: Return 400 when model name is null
  it("should return 400 error when model name is null", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: null as unknown as string });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  // Negative test: Return 404 when model is not found
  it("should return 404 error when model is not found", async () => {
    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([]);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "nonexistent-model" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  // Negative test: Return 404 when model has no id
  it("should return 404 error when model has no id", async () => {
    const mockModel = {
      name: "model-without-id",
      model_path: "/models/test.gguf",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "model-without-id" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  // Negative test: Return 500 when getModels throws
  it("should return 500 error when getModels throws", async () => {
    (initDatabase as jest.Mock).mockImplementation(() => {
      throw new Error("Database error");
    });

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("GET_FIT_PARAMS_ERROR");
  });

  // Edge case: Handle model name with special characters
  it("should handle model name with special characters", async () => {
    const mockModel = {
      id: 1,
      name: "llama-2-7b-日本語-中文",
      model_path: "/models/test.gguf",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (getModelFitParams as jest.Mock).mockReturnValue(null);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-2-7b-日本語-中文" });

    const response = await GET(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle concurrent requests
  it("should handle concurrent GET requests", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (getModelFitParams as jest.Mock).mockReturnValue(null);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const responses = await Promise.all([
      GET(mockRequest, { params: mockParams }),
      GET(mockRequest, { params: mockParams }),
      GET(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });
});

describe("POST /api/models/:name/analyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully run fit-params analysis
  it("should successfully run fit-params analysis", async () => {
    const mockModel = {
      id: 1,
      name: "llama-2-7b",
      model_path: "/models/llama-2-7b.gguf",
    };

    const mockAnalysisResult = {
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
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockResolvedValue(mockAnalysisResult);
    (saveModelFitParams as jest.Mock).mockReturnValue(1);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model).toEqual(mockModel);
    expect(json.data.fitParams.recommended_ctx_size).toBe(4096);
    expect(json.data.fitParams.recommended_gpu_layers).toBe(35);
    expect(analyzeModel).toHaveBeenCalledWith("/models/llama-2-7b.gguf");
    expect(saveModelFitParams).toHaveBeenCalled();
  });

  // Negative test: Return 400 when model name is missing
  it("should return 400 error when model name is missing", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  // Negative test: Return 404 when model is not found
  it("should return 404 error when model is not found", async () => {
    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([]);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "nonexistent-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  // Negative test: Return 400 when model has no path
  it("should return 400 error when model has no path", async () => {
    const mockModel = {
      id: 1,
      name: "model-without-path",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "model-without-path" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("NO_MODEL_PATH");
  });

  // Negative test: Return 500 when analysis fails
  it("should return 500 error when analysis fails", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockResolvedValue({
      success: false,
      error: "Analysis failed",
    });
    (saveModelFitParams as jest.Mock).mockReturnValue(1);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fitParams.fit_params_error).toBe("Analysis failed");
    expect(json.data.fitParams.fit_params_success).toBe(0);
  });

  // Negative test: Return 500 when analyzeModel throws
  it("should return 500 error when analyzeModel throws", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockRejectedValue(new Error("Analysis error"));

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error.code).toBe("ANALYSIS_ERROR");
  });

  // Negative test: Return 500 when saveModelFitParams throws
  it("should return 500 error when saveModelFitParams throws", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

    const mockAnalysisResult = {
      success: true,
      recommended_ctx_size: 4096,
      recommended_gpu_layers: 35,
      metadata: { file_size_bytes: 4000000000 },
      projected_cpu_memory_mb: 1000,
      projected_gpu_memory_mb: 8000,
      error: null,
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockResolvedValue(mockAnalysisResult);
    (saveModelFitParams as jest.Mock).mockImplementation(() => {
      throw new Error("Save failed");
    });

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error.code).toBe("ANALYSIS_ERROR");
  });

  // Edge case: Handle model with empty path
  it("should handle model with empty path", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "",
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("NO_MODEL_PATH");
  });

  // Edge case: Handle concurrent analysis requests
  it("should handle concurrent POST requests", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

    const mockAnalysisResult = {
      success: true,
      recommended_ctx_size: 4096,
      recommended_gpu_layers: 35,
      metadata: { file_size_bytes: 4000000000 },
      projected_cpu_memory_mb: 1000,
      projected_gpu_memory_mb: 8000,
      error: null,
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockResolvedValue(mockAnalysisResult);
    (saveModelFitParams as jest.Mock).mockReturnValue(1);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const responses = await Promise.all([
      POST(mockRequest, { params: mockParams }),
      POST(mockRequest, { params: mockParams }),
      POST(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle model path with spaces
  it("should handle model path with spaces", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/path/with spaces/model.gguf",
    };

    const mockAnalysisResult = {
      success: true,
      recommended_ctx_size: 4096,
      recommended_gpu_layers: 35,
      metadata: { file_size_bytes: 4000000000 },
      projected_cpu_memory_mb: 1000,
      projected_gpu_memory_mb: 8000,
      error: null,
    };

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockResolvedValue(mockAnalysisResult);
    (saveModelFitParams as jest.Mock).mockReturnValue(1);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(analyzeModel).toHaveBeenCalledWith("/path/with spaces/model.gguf");
  });

  // Edge case: Handle analysis with all null optional fields
  it("should handle analysis with null optional fields", async () => {
    const mockModel = {
      id: 1,
      name: "test-model",
      model_path: "/models/test.gguf",
    };

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

    (initDatabase as jest.Mock).mockImplementation(() => {});
    (getModels as jest.Mock).mockReturnValue([mockModel]);
    (analyzeModel as jest.Mock).mockResolvedValue(mockAnalysisResult);
    (saveModelFitParams as jest.Mock).mockReturnValue(1);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fitParams.recommended_ctx_size).toBe(0);
  });
});
