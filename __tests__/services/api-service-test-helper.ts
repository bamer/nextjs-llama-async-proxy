/**
 * Common beforeEach setup for all API service tests
 */
export function setupApiTests(mockStore: any): void {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getState.mockReturnValue({
      setModels: jest.fn(),
      addModel: jest.fn(),
      updateModel: jest.fn(),
      removeModel: jest.fn(),
      setMetrics: jest.fn(),
      setLogs: jest.fn(),
      clearLogs: jest.fn(),
      updateSettings: jest.fn(),
    } as any);
  });
}

/**
 * Create a mock API response
 */
export function createMockResponse<T>(
  success: true,
  data: T
): { success: true; data: T; timestamp: string };

export function createMockResponse(
  success: false,
  error: { code: string; message: string }
): { success: false; error: { code: string; message: string }; timestamp: string };

export function createMockResponse<T>(
  success: boolean,
  dataOrError: T | { code: string; message: string }
): any {
  return {
    success,
    ...(success ? { data: dataOrError } : { error: dataOrError }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a mock model object
 */
export function createMockModel(id: string, name: string, status = 'idle'): any {
  return {
    id,
    name,
    status,
    filePath: `/path/${id}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Create a mock fit params object
 */
export function createMockFitParams(): any {
  return {
    recommended_ctx_size: 4096,
    recommended_gpu_layers: 30,
    recommended_tensor_split: null,
    file_size_bytes: 1000000,
    quantization_type: 'q4_0',
    parameter_count: 1000000,
    architecture: 'llama',
    context_window: 4096,
    fit_params_analyzed_at: Date.now(),
    fit_params_success: 1,
    fit_params_error: null,
    fit_params_raw_output: null,
    projected_cpu_memory_mb: 500,
    projected_gpu_memory_mb: 1000,
  };
}
