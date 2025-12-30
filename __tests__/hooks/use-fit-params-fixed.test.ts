import { renderHook, act } from "@testing-library/react";
import { useFitParams, ApiResponse } from "../../src/hooks/use-fit-params";

// Helper function to create mock Response
function createMockResponse<T>(data: T, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    type: 'basic',
    url: '',
    clone: () => ({} as Response),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
  } as Response;
}

describe("useFitParams", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with null data and no error", () => {
    const { result } = renderHook(() => useFitParams("test-model"));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch data when model name is null", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    renderHook(() => useFitParams(null));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should fetch fit-params data on mount", async () => {
    const mockFitParams = {
      id: 1,
      model_id: 1,
      recommended_ctx_size: 4096,
      recommended_gpu_layers: 35,
      recommended_tensor_split: "0,1",
      file_size_bytes: 4200000000,
      quantization_type: "Q4_K_M",
      parameter_count: 8000000000,
      architecture: "Llama",
      context_window: 4096,
      fit_params_analyzed_at: Date.now(),
      fit_params_success: 1,
      fit_params_error: null,
      fit_params_raw_output: "test output",
      projected_cpu_memory_mb: 8000,
      projected_gpu_memory_mb: 5000,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const mockApiResponse: ApiResponse<{ model: { id: number; name: string }; fitParams: typeof mockFitParams }> = {
      success: true,
      data: {
        model: { id: 1, name: "test-model" },
        fitParams: mockFitParams,
      },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockApiResponse));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/models/test-model/analyze");
    expect(result.current.data).toEqual(mockFitParams);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle successful response with no fit-params", async () => {
    const mockApiResponse: ApiResponse<{ model: { id: number; name: string }; fitParams: null }> = {
      success: true,
      data: {
        model: { id: 1, name: "test-model" },
        fitParams: null,
      },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockApiResponse));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toBeNull();
  });

  it("should handle API error response", async () => {
    const mockErrorResponse: ApiResponse = {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: "Failed to analyze model",
      },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockErrorResponse, false));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Failed to analyze model");
    expect(result.current.data).toBeNull();
  });

  it("should handle network error", async () => {
    const fetchMock = jest.fn().mockRejectedValueOnce(new Error("Network error"));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Network error");
  });

  it("should call refresh function to re-fetch data", async () => {
    const mockFitParams = {
      id: 1,
      recommended_ctx_size: 4096,
    } as any;

    const mockApiResponse: ApiResponse = {
      success: true,
      data: { model: { id: 1, name: "test-model" }, fitParams: mockFitParams },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockApiResponse));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should analyze model on analyze call", async () => {
    const mockFitParams = {
      id: 2,
      recommended_ctx_size: 8192,
    } as any;

    const mockApiResponse: ApiResponse = {
      success: true,
      data: { model: { id: 1, name: "test-model" }, fitParams: mockFitParams },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockApiResponse));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await result.current.analyze();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/models/test-model/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(result.current.data).toEqual(mockFitParams);
  });

  it("should handle analyze error", async () => {
    const mockErrorResponse: ApiResponse = {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: "Analysis failed",
      },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockErrorResponse, false));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    await act(async () => {
      await result.current.analyze();
    });

    expect(result.current.error).toBe("Analysis failed");
  });

  it("should set loading state correctly", async () => {
    const mockApiResponse: ApiResponse = {
      success: true,
      data: { model: { id: 1, name: "test-model" }, fitParams: null },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(createMockResponse(mockApiResponse));
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams("test-model"));

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
  });

  it("should not call refresh when model name changes to null", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const { rerender } = renderHook(({ modelName }) => useFitParams(modelName), {
      initialProps: { modelName: "test-model" },
    });

    await act(async () => {
      await Promise.resolve();
    });

    rerender({ modelName: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should re-fetch when model name changes", async () => {
    const mockApiResponse: ApiResponse = {
      success: true,
      data: { model: { id: 1, name: "test-model" }, fitParams: null },
      timestamp: Date.now(),
    };

    const fetchMock = jest.fn().mockResolvedValue(createMockResponse(mockApiResponse));
    global.fetch = fetchMock as any;

    const { rerender } = renderHook(({ modelName }) => useFitParams(modelName), {
      initialProps: { modelName: "model1" },
    });

    await act(async () => {
      await Promise.resolve();
    });

    rerender({ modelName: "model2" });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should handle analyze when model name is null", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useFitParams(null));

    await act(async () => {
      await result.current.analyze();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
