import { renderHook, waitFor, act } from '@testing-library/react';
import { useFitParams } from '@/hooks/use-fit-params';

// Helper function to create a mock Response object
function createMockResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
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

// Mock fetch globally
const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = fetchMock;

describe('useFitParams', () => {
  const mockFitParams = {
    id: 1,
    model_id: 123,
    recommended_ctx_size: 4096,
    recommended_gpu_layers: 35,
    recommended_tensor_split: '0.5,0.5',
    file_size_bytes: 1000000,
    quantization_type: 'Q4_K_M',
    parameter_count: 7000000000,
    architecture: 'llama',
    context_window: 4096,
    fit_params_analyzed_at: 1640995200000,
    fit_params_success: 1,
    fit_params_error: null,
    fit_params_raw_output: 'Analysis completed successfully',
    projected_cpu_memory_mb: 2048,
    projected_gpu_memory_mb: 4096,
    created_at: 1640995200000,
    updated_at: 1640995200000,
  } as const;

  const mockApiResponse = {
    success: true,
    data: {
      model: { id: 123, name: 'test-model' },
      fitParams: mockFitParams,
    },
    timestamp: Date.now(),
  } as const;

  const mockApiResponseNoFitParams = {
    success: true,
    data: {
      model: { id: 123, name: 'test-model' },
      fitParams: null,
    },
    timestamp: Date.now(),
  } as const;

  const mockErrorResponse = {
    success: false,
    error: {
      code: 'ANALYSIS_FAILED',
      message: 'Model analysis failed',
    },
    timestamp: Date.now(),
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with null data and no loading/error when modelName is null', () => {
      const { result } = renderHook(() => useFitParams(null));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

  it('should initialize with null data when modelName is provided', () => {
    const { result } = renderHook(() => useFitParams('test-model'));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
  });

  describe('refresh functionality', () => {
    it('should not fetch data when modelName is null', async () => {
      const { result } = renderHook(() => useFitParams(null));

      await act(async () => {
        await result.current.refresh();
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should fetch fit params data on refresh when modelName is provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse)).mockResolvedValueOnce(
        createMockResponse(mockApiResponse)
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1); // Initial mount call
      });

      await act(async () => {
        await result.current.refresh();
      });

      // Should be called for both mount and refresh
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledWith('/api/models/test-model/analyze');
    });

    it('should set loading state during refresh', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      }) as Promise<Response>;

      fetchMock.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useFitParams('test-model'));

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);

      // Resolve fetch
      act(() => {
        resolveFetch({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set data when refresh succeeds with fit params', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse));

      const { result } = renderHook(() => useFitParams('test-model'));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toEqual(mockFitParams);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle responses with no fit params', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponseNoFitParams));

      const { result } = renderHook(() => useFitParams('test-model'));

      await waitFor(() => {
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle HTTP error responses', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockErrorResponse, false));

      const { result } = renderHook(() => useFitParams('test-model'));

      await waitFor(() => {
        expect(result.current.error).toBe('Model analysis failed');
        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFitParams('test-model'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith('[useFitParams] Error fetching fit-params:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      fetchMock.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useFitParams('test-model'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await waitFor(() => {
        expect(result.current.error).toBe('Unknown error');
        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith('[useFitParams] Error fetching fit-params:', 'String error');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('analyze functionality', () => {
    it('should not analyze when modelName is null', async () => {
      const { result } = renderHook(() => useFitParams(null));

      await act(async () => {
        await result.current.analyze();
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should POST to analyze endpoint when modelName is provided', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiResponse));

      const { result } = renderHook(() => useFitParams('test-model'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      fetchMock.mockClear();

      await act(async () => {
        await result.current.analyze();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/models/test-model/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should set loading state during analyze', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      }) as Promise<Response>;

      fetchMock.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useFitParams('test-model'));

      // Trigger analyze
      act(() => {
        result.current.analyze();
      });

      expect(result.current.loading).toBe(true);

      // Resolve fetch
      act(() => {
        resolveFetch({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set data when analyze succeeds', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse));

      const { result } = renderHook(() => useFitParams('test-model'));

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.data).toEqual(mockFitParams);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle analyze errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse)).mockResolvedValueOnce(
        createMockResponse(mockErrorResponse, false)
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toEqual(mockFitParams);
      });

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.error).toBe('Model analysis failed');
      // Data should remain from the successful initial load
      expect(result.current.data).toEqual(mockFitParams);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('automatic refresh on mount', () => {
    it('should automatically refresh on mount when modelName is provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse));

      renderHook(() => useFitParams('test-model'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should not automatically refresh on mount when modelName is null', () => {
      renderHook(() => useFitParams(null));

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('modelName changes', () => {
    it('should refresh when modelName changes', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiResponse));

      const { rerender } = renderHook(
        ({ modelName }: { modelName: string }) => useFitParams(modelName),
        { initialProps: { modelName: 'model1' } }
      );

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });

      rerender({ modelName: 'model2' });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('return values', () => {
    it('should return data, loading, error, analyze, and refresh functions', () => {
      const { result } = renderHook(() => useFitParams('test-model'));

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('analyze');
      expect(result.current).toHaveProperty('refresh');

      expect(typeof result.current.analyze).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle malformed JSON response', async () => {
      // Mock fetch to throw error when response.json() is called
      fetchMock.mockRejectedValueOnce(new Error('Invalid JSON'));

      const { result } = renderHook(() => useFitParams('test-model'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe('Invalid JSON');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle missing success field in response', async () => {
      const incompleteResponse = {
        success: false,
        data: { fitParams: mockFitParams },
        timestamp: Date.now(),
      };

      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse)).mockResolvedValueOnce(
        createMockResponse(incompleteResponse)
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toBeNull(); // success is false
    });

    it('should handle missing data field in response', async () => {
      const incompleteResponse = {
        success: true,
        timestamp: Date.now(),
      };

      fetchMock.mockResolvedValueOnce(createMockResponse(mockApiResponse)).mockResolvedValueOnce(
        createMockResponse(incompleteResponse)
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toBeNull(); // fitParams is undefined
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple refresh calls', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiResponse));

      const { result } = renderHook(() => useFitParams('test-model'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      fetchMock.mockClear();

      await act(async () => {
        await Promise.all([
          result.current.refresh(),
          result.current.refresh(),
          result.current.analyze(),
        ]);
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should maintain loading state during concurrent operations', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      }) as Promise<Response>;

      fetchMock.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useFitParams('test-model'));

      // Start multiple operations
      act(() => {
        result.current.refresh();
        result.current.analyze();
      });

      expect(result.current.loading).toBe(true);

      // Resolve one fetch
      act(() => {
        resolveFetch(createMockResponse(mockApiResponse));
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
  describe('analyze error branch coverage (line 96)', () => {
    it('should handle analyze HTTP error responses', async () => {
      fetchMock.mockResolvedValue(
        createMockResponse({
          success: false,
          error: {
            code: 'ANALYSIS_FAILED',
            message: 'Model analysis failed',
          },
          timestamp: Date.now(),
        }, false)
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.error).toBe('Model analysis failed');
      expect(result.current.loading).toBe(false);
    });

    it('should handle analyze network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useFitParams('test-model'));

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.error).toBe('Network failure');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('success/fitParams null handling (line 99)', () => {
    it('should set null when success is false', async () => {
      fetchMock.mockResolvedValue(
        createMockResponse({
          success: false,
          data: {
            model: { id: 123, name: 'test-model' },
            fitParams: null, // Explicitly null
          },
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should set null when fitParams is undefined', async () => {
      fetchMock.mockResolvedValue(
        createMockResponse({
          success: true,
          data: {
            model: { id: 123, name: 'test-model' },
            // fitParams property missing
          },
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(() => useFitParams('test-model'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });
  });
