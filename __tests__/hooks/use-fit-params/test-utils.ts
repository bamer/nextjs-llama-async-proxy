import { renderHook, act } from "@testing-library/react";

export function createMockResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Error",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createMockResponse(data, ok),
  } as unknown as Response;
}

export const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = fetchMock;

export const mockFitParams = {
  id: 1,
  model_id: 123,
  recommended_ctx_size: 4096,
  recommended_gpu_layers: 35,
  recommended_tensor_split: "0.5,0.5",
  file_size_bytes: 1000000,
  quantization_type: "Q4_K_M",
  parameter_count: 7000000000,
  architecture: "llama",
  context_window: 4096,
  fit_params_analyzed_at: 1640995200000,
  fit_params_success: 1,
  fit_params_error: null,
  fit_params_raw_output: "Analysis completed successfully",
  projected_cpu_memory_mb: 2048,
  projected_gpu_memory_mb: 4096,
  created_at: 1640995200000,
  updated_at: 1640995200000,
} as const;

export const mockApiResponse = {
  success: true,
  data: {
    model: { id: 123, name: "test-model" },
    fitParams: mockFitParams,
  },
  timestamp: Date.now(),
} as const;

export const mockApiResponseNoFitParams = {
  success: true,
  data: {
    model: { id: 123, name: "test-model" },
    fitParams: null,
  },
  timestamp: Date.now(),
} as const;

export const mockErrorResponse = {
  success: false,
  error: {
    code: "ANALYSIS_FAILED",
    message: "Model analysis failed",
  },
  timestamp: Date.now(),
} as const;

export function setupBefore() {
  jest.clearAllMocks();
  fetchMock.mockClear();
}
